import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';

const db = prisma as any;

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

// GET /api/trending - Établissements populaires / tendances
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20);
  const type = searchParams.get('type'); // HOTEL, RESTAURANT, ATTRACTION

  try {
    const where: any = { moderationStatus: 'approved', isActive: true };
    if (type) where.type = type;

    // Top rated + most reviewed = trending
    const trending = await db.establishment.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        city: true,
        coverImage: true,
        rating: true,
        reviewCount: true,
        isFeatured: true,
        description: true,
        restaurant: { select: { priceRange: true } },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { reviewCount: 'desc' },
        { rating: 'desc' },
      ],
      take: limit,
    });

    // Enrichir avec l'URL de la page
    const enriched = trending.map((e: any) => ({
      ...e,
      priceRange: e.restaurant?.priceRange || null,
      restaurant: undefined,
      url: `/bons-plans/${e.type === 'HOTEL' ? 'hotels' : e.type === 'RESTAURANT' ? 'restaurants' : e.type === 'PROVIDER' ? 'prestataires' : 'attractions'}/${e.slug}`,
      shortDescription: e.description ? e.description.substring(0, 100) + (e.description.length > 100 ? '...' : '') : null,
    }));

    return NextResponse.json({ success: true, trending: enriched }, { headers: CACHE_HEADERS });
  } catch (error: unknown) {
    logger.error('[TRENDING] Error:', error);
    return apiError('Erreur serveur', 500);
  }
}
