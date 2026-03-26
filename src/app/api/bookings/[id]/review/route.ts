import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { sendNotification } from '@/lib/email';
import { sendPushToUser } from '@/lib/push';
import { awardLoyaltyPoints, LOYALTY_POINTS } from '@/lib/loyalty';

// POST /api/bookings/[id]/review - Create a verified review linked to a booking
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

  // Authentication
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { id: bookingId } = await params;

  try {
    const body = await request.json().catch(() => null);
    if (body === null) {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    // CSRF verification
    if (!body.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return NextResponse.json({ error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    // Fetch the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        establishment: { select: { id: true, name: true, claimedByUserId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }

    // Check ownership
    if (booking.userId !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Check booking is completed
    if (booking.status !== 'completed') {
      return NextResponse.json(
        { error: 'La réservation doit être terminée pour laisser un avis' },
        { status: 400 }
      );
    }

    // Check no existing review for this booking
    const existingReview = await prisma.establishmentReview.findUnique({
      where: { bookingId },
    });
    if (existingReview) {
      return NextResponse.json(
        { error: 'Vous avez déjà laissé un avis pour cette réservation' },
        { status: 400 }
      );
    }

    // Validate rating
    const { rating, comment, title, images } = body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'La note doit être entre 1 et 5' }, { status: 400 });
    }

    // Validate comment
    if (!comment || typeof comment !== 'string' || comment.length < 10) {
      return NextResponse.json(
        { error: 'Le commentaire doit contenir au moins 10 caractères' },
        { status: 400 }
      );
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
          return NextResponse.json({ error: "URL d'image invalide" }, { status: 400 });
        }
      }
    }

    // Build author name from user profile
    const authorName = `${user.firstName} ${user.lastName.charAt(0)}.`;

    // Create the verified review
    const review = await prisma.establishmentReview.create({
      data: {
        establishmentId: booking.establishmentId,
        bookingId,
        userId: user.id,
        authorName,
        rating,
        title: title || null,
        comment,
        isVerified: true,
        isPublished: true,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
      },
    });

    // Update establishment average rating
    const avgResult = await prisma.establishmentReview.aggregate({
      where: { establishmentId: booking.establishmentId, isPublished: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.establishment.update({
      where: { id: booking.establishmentId },
      data: {
        rating: avgResult._avg.rating || 0,
        reviewCount: avgResult._count.rating || 0,
      },
    });

    // Award loyalty points for verified review
    awardLoyaltyPoints({
      userId: user.id,
      type: 'REVIEW_POSTED',
      points: LOYALTY_POINTS.REVIEW_POSTED,
      description: `Avis vérifié pour ${booking.establishment.name}`,
      entityId: review.id,
    }).catch(() => {});

    // Notify establishment owner of new verified review
    if (booking.establishment.claimedByUserId) {
      const owner = await prisma.user.findUnique({
        where: { id: booking.establishment.claimedByUserId },
        select: { id: true, email: true },
      });

      if (owner) {
        // In-app notification
        prisma.notification.create({
          data: {
            userId: owner.id,
            type: 'REVIEW_NEW' as any,
            title: `Avis vérifié (${rating}★) pour ${booking.establishment.name}`,
            message: comment.slice(0, 100),
            entityType: 'review',
            entityId: review.id,
          },
        }).catch(() => {});

        // Push notification
        sendPushToUser(owner.id, {
          title: `Avis vérifié pour ${booking.establishment.name}`,
          body: `${authorName} a laissé un avis ${rating}★`,
          url: '/dashboard/avis',
          tag: 'review_new',
        }).catch(() => {});

        // Email notification
        if (owner.email) {
          sendNotification({
            to: owner.email,
            type: 'review_new',
            data: {
              establishmentName: booking.establishment.name,
              rating,
              authorName,
              title: title || null,
              comment,
              isVerified: true,
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
    logger.error('[BOOKINGS] Create verified review error:', error);
    return apiError('Erreur serveur', 500);
  }
}
