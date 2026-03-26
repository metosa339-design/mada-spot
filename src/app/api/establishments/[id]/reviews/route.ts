import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';

import { logger } from '@/lib/logger';
import { sendNotification } from '@/lib/email';
import { sendPushToUser } from '@/lib/push';
import { awardLoyaltyPoints, LOYALTY_POINTS } from '@/lib/loyalty';

// GET /api/establishments/[id]/reviews - List reviews for an establishment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
  const sort = searchParams.get('sort') || 'recent'; // recent | highest | lowest
  const verified = searchParams.get('verified') === 'true';
  const withPhotos = searchParams.get('withPhotos') === 'true';

  // Build sort order
  const orderBy: Record<string, string> =
    sort === 'highest' ? { rating: 'desc' } :
    sort === 'lowest' ? { rating: 'asc' } :
    { createdAt: 'desc' };

  // Build filter
  const where: Record<string, any> = { establishmentId: id, isPublished: true };
  if (verified) where.isVerified = true;
  if (withPhotos) where.images = { not: null };

  try {
    const [reviews, total, establishment] = await Promise.all([
      prisma.establishmentReview.findMany({
        where,
        select: {
          id: true, establishmentId: true, authorName: true, userId: true,
          rating: true, title: true, comment: true, images: true,
          isVerified: true, isPublished: true, ownerResponse: true,
          respondedAt: true, createdAt: true,
          helpfulCount: true, unhelpfulCount: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.establishmentReview.count({ where }),
      prisma.establishment.findUnique({
        where: { id },
        select: { name: true, rating: true, reviewCount: true },
      }),
    ]);

    return NextResponse.json({ reviews, total, establishment });
  } catch (error) {
    logger.error('Error fetching reviews:', error);
    return apiError('Erreur serveur', 500);
  }
}

// POST /api/establishments/[id]/reviews - Submit a new review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, 'write');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  const { id } = await params;

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // CSRF verification (mandatory)
    if (!body.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return NextResponse.json({ error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    const { rating, title, comment, authorName, authorEmail, images } = body;

    if (!rating || !comment) {
      return NextResponse.json({ error: 'Note et commentaire requis' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'La note doit être entre 1 et 5' }, { status: 400 });
    }

    if (comment.length < 10) {
      return NextResponse.json({ error: 'Le commentaire doit contenir au moins 10 caractères' }, { status: 400 });
    }

    // Validate images if provided
    if (images !== undefined && images !== null) {
      if (!Array.isArray(images)) {
        return NextResponse.json({ error: 'Les images doivent être un tableau' }, { status: 400 });
      }
      if (images.length > 3) {
        return NextResponse.json({ error: 'Maximum 3 photos par avis' }, { status: 400 });
      }
      for (const img of images) {
        if (typeof img !== 'string' || !img.startsWith('/uploads/image/')) {
          return NextResponse.json({ error: 'URL d\'image invalide' }, { status: 400 });
        }
      }
    }

    // Check establishment exists
    const establishment = await prisma.establishment.findUnique({ where: { id } });
    if (!establishment || !establishment.isActive) {
      return NextResponse.json({ error: 'Établissement introuvable' }, { status: 404 });
    }

    // Check if logged in user
    let userId: string | null = null;
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const session = await verifySession(token);
      if (session) userId = session.id;
    }

    const review = await prisma.establishmentReview.create({
      data: {
        establishmentId: id,
        rating,
        title: title || null,
        comment,
        authorName: authorName || null,
        authorEmail: authorEmail || null,
        userId,
        isVerified: false,
        isPublished: true,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
      },
    });

    // Update establishment average rating
    const avgResult = await prisma.establishmentReview.aggregate({
      where: { establishmentId: id, isPublished: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.establishment.update({
      where: { id },
      data: {
        rating: avgResult._avg.rating || 0,
        reviewCount: avgResult._count.rating || 0,
      },
    });

    // Award loyalty points for posting a review
    if (userId) {
      awardLoyaltyPoints({
        userId,
        type: 'REVIEW_POSTED',
        points: LOYALTY_POINTS.REVIEW_POSTED,
        description: `Avis publié pour ${establishment.name}`,
        entityId: review.id,
      }).catch(() => {});

      // Check and award badges (fire-and-forget)
      import('@/lib/badges').then(({ checkAndAwardBadges }) => {
        checkAndAwardBadges(userId!).catch(() => {});
      }).catch(() => {});
    }

    // Notify establishment owner of new review
    if (establishment.claimedByUserId) {
      const owner = await prisma.user.findUnique({
        where: { id: establishment.claimedByUserId },
        select: { id: true, email: true },
      });

      if (owner) {
        // In-app notification
        prisma.notification.create({
          data: {
            userId: owner.id,
            type: 'REVIEW_NEW' as any,
            title: `Nouvel avis (${rating}★) pour ${establishment.name}`,
            message: comment.slice(0, 100),
            entityType: 'review',
            entityId: review.id,
          },
        }).catch(() => {});

        // Push notification
        sendPushToUser(owner.id, {
          title: `Nouvel avis pour ${establishment.name}`,
          body: `${authorName || 'Anonyme'} a laissé un avis ${rating}★`,
          url: '/dashboard/avis',
          tag: 'review_new',
        }).catch(() => {});

        // Email notification
        if (owner.email) {
          sendNotification({
            to: owner.email,
            type: 'review_new',
            data: {
              establishmentName: establishment.name,
              rating,
              authorName: authorName || 'Anonyme',
              title: title || null,
              comment,
              isVerified: false,
              entityType: 'review',
              entityId: review.id,
              url: '/dashboard/avis',
            },
          }).catch(() => {});
        }
      }
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    logger.error('Error creating review:', error);
    return apiError('Erreur serveur', 500);
  }
}
