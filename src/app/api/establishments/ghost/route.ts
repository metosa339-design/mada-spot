import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { generateUniqueSlug } from '@/lib/import/slug-generator';
import { sendGhostCreatedNotificationToAdmin } from '@/lib/email';
import { logger } from '@/lib/logger';

const VALID_TYPES = ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'];

// POST /api/establishments/ghost - Create a ghost establishment + review
export async function POST(request: NextRequest) {
  // Rate limiting (strict — 3 per hour)
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, 'write');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
    }

    // CSRF verification
    if (!body.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
    }

    // Auth — user must be logged in
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
    }
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    // Validate fields
    const { name, city, region, type, rating, comment } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Le nom doit contenir au moins 2 caractères' }, { status: 400 });
    }
    if (!city || typeof city !== 'string' || city.trim().length < 2) {
      return NextResponse.json({ error: 'La ville est requise' }, { status: 400 });
    }
    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
    }
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'La note doit être entre 1 et 5' }, { status: 400 });
    }
    if (!comment || typeof comment !== 'string' || comment.trim().length < 10) {
      return NextResponse.json({ error: 'Le commentaire doit contenir au moins 10 caractères' }, { status: 400 });
    }

    // Generate unique slug
    const slug = await generateUniqueSlug(name.trim(), city.trim());

    // Get user info for the review author name
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const authorName = `${user.firstName} ${user.lastName}`.trim() || 'Voyageur';

    // Transaction: create ghost establishment + review
    const result = await prisma.$transaction(async (tx) => {
      const establishment = await tx.establishment.create({
        data: {
          name: name.trim(),
          slug,
          type,
          city: city.trim(),
          region: region?.trim() || null,
          description: '',
          isActive: false,
          moderationStatus: 'pending_review',
          isGhost: true,
          createdByUserId: user.id,
          rating,
          reviewCount: 1,
        },
      });

      const review = await tx.establishmentReview.create({
        data: {
          establishmentId: establishment.id,
          userId: user.id,
          authorName,
          authorEmail: user.email,
          rating,
          comment: comment.trim(),
          isVerified: true,
          isPublished: true,
        },
      });

      return { establishment, review };
    });

    // Notify admins (best-effort, don't fail the request)
    const categoryLabels: Record<string, string> = { HOTEL: 'Hébergement', RESTAURANT: 'Restaurant', ATTRACTION: 'Attraction', PROVIDER: 'Prestataire' };
    const categoryLabel = categoryLabels[type] || type;

    sendGhostCreatedNotificationToAdmin(name.trim(), authorName, city.trim(), categoryLabel).catch(() => {});

    // Create in-app notification for all admins
    try {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((admin) => ({
            userId: admin.id,
            type: 'GHOST_CREATED' as any,
            title: `Nouveau lieu communautaire : ${name.trim()}`,
            message: `${authorName} a créé une fiche pour "${name.trim()}" à ${city.trim()} (${categoryLabel})`,
            entityType: 'establishment',
            entityId: result.establishment.id,
          })),
        });
      }
    } catch (e) {
      logger.error('Failed to create admin notifications for ghost:', e);
    }

    return NextResponse.json({
      success: true,
      establishment: {
        id: result.establishment.id,
        slug: result.establishment.slug,
        name: result.establishment.name,
      },
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creating ghost establishment:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
