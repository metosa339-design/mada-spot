import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';

import { logger } from '@/lib/logger';

// GET - Récupérer les favoris du client (établissements)
export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return apiError('Non authentifié', 401);
    }

    const sessionUser = await verifySession(token);
    if (!sessionUser || sessionUser.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const favorites = await prisma.establishmentFavorite.findMany({
      where: { userId: sessionUser.id },
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
            shortDescription: true,
            isFeatured: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      favorites: favorites.map((f) => ({
        id: f.id,
        addedAt: f.createdAt,
        establishment: f.establishment,
      })),
    });
  } catch (error) {
    logger.error('Erreur récupération favoris:', error);
    return apiError('Erreur serveur', 500);
  }
}

// POST - Ajouter un favori
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rl = checkRateLimit(clientId, 'write');
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Trop de requêtes' },
        { status: 429, headers: getRateLimitHeaders(rl) }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return apiError('Non authentifié', 401);
    }

    const sessionUser = await verifySession(token);
    if (!sessionUser || sessionUser.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.establishmentId) {
      return apiError('establishmentId requis', 400);
    }

    // Check establishment exists
    const establishment = await prisma.establishment.findUnique({
      where: { id: body.establishmentId },
      select: { id: true },
    });

    if (!establishment) {
      return apiError('Établissement introuvable', 404);
    }

    // Upsert to avoid duplicates
    const favorite = await prisma.establishmentFavorite.upsert({
      where: {
        userId_establishmentId: {
          userId: sessionUser.id,
          establishmentId: body.establishmentId,
        },
      },
      update: {},
      create: {
        userId: sessionUser.id,
        establishmentId: body.establishmentId,
      },
    });

    return NextResponse.json({ success: true, favoriteId: favorite.id }, { status: 201 });
  } catch (error) {
    logger.error('Erreur ajout favori:', error);
    return apiError('Erreur serveur', 500);
  }
}

// DELETE - Retirer un favori
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return apiError('Non authentifié', 401);
    }

    const sessionUser = await verifySession(token);
    if (!sessionUser || sessionUser.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get('establishmentId');

    if (!establishmentId) {
      return apiError('establishmentId requis', 400);
    }

    await prisma.establishmentFavorite.deleteMany({
      where: {
        userId: sessionUser.id,
        establishmentId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur suppression favori:', error);
    return apiError('Erreur serveur', 500);
  }
}
