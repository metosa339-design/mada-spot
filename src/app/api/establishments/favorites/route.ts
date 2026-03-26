import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { requireAuth } from '@/lib/auth/middleware';
import { verifyCsrfToken } from '@/lib/csrf';

import { logger } from '@/lib/logger';
import { awardLoyaltyPoints, LOYALTY_POINTS } from '@/lib/loyalty';
// GET /api/establishments/favorites - Lister mes établissements favoris
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const favorites = await db.establishmentFavorite.findMany({
      where: { userId: user.id },
      include: {
        establishment: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            city: true,
            coverImage: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = favorites.map((f: any) => ({
      id: f.id,
      addedAt: f.createdAt,
      ...f.establishment,
      url: `/bons-plans/${f.establishment.type === 'HOTEL' ? 'hotels' : f.establishment.type === 'RESTAURANT' ? 'restaurants' : 'attractions'}/${f.establishment.slug}`,
    }));

    return NextResponse.json({ success: true, favorites: formatted });
  } catch (error: unknown) {
    logger.error('[EST FAVORITES] List error:', error);
    return apiError('Erreur serveur', 500);
  }
}

// POST /api/establishments/favorites - Ajouter un favori
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // CSRF verification (mandatory)
    if (!body.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return NextResponse.json({ error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    const { establishmentId } = body;
    if (!establishmentId) {
      return NextResponse.json({ error: 'establishmentId requis' }, { status: 400 });
    }

    const establishment = await prisma.establishment.findUnique({ where: { id: establishmentId } });
    if (!establishment) {
      return NextResponse.json({ error: 'Établissement introuvable' }, { status: 404 });
    }

    const existing = await prisma.establishmentFavorite.findUnique({
      where: { userId_establishmentId: { userId: user.id, establishmentId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Déjà en favori' }, { status: 409 });
    }

    const favorite = await prisma.establishmentFavorite.create({
      data: { userId: user.id, establishmentId },
    });

    // Award loyalty points for adding favorite
    awardLoyaltyPoints({
      userId: user.id,
      type: 'FAVORITE_ADDED',
      points: LOYALTY_POINTS.FAVORITE_ADDED,
      description: `Favori ajouté — ${establishment.name || 'Établissement'}`,
      entityId: establishmentId,
    }).catch(() => {});

    return NextResponse.json({ success: true, favoriteId: favorite.id });
  } catch (error: unknown) {
    logger.error('[EST FAVORITES] Add error:', error);
    return apiError('Erreur serveur', 500);
  }
}

// DELETE /api/establishments/favorites?establishmentId=xxx - Retirer un favori
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get('establishmentId');
    if (!establishmentId) {
      return NextResponse.json({ error: 'establishmentId requis' }, { status: 400 });
    }

    await prisma.establishmentFavorite.deleteMany({
      where: { userId: user.id, establishmentId },
    });

    // Deduct loyalty points for removing favorite
    awardLoyaltyPoints({
      userId: user.id,
      type: 'FAVORITE_REMOVED',
      points: LOYALTY_POINTS.FAVORITE_REMOVED,
      description: 'Favori retiré',
      entityId: establishmentId,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error('[EST FAVORITES] Remove error:', error);
    return apiError('Erreur serveur', 500);
  }
}
