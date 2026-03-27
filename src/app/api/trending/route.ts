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

    // Fetch more than needed so we can re-sort by completeness
    const raw = await db.establishment.findMany({
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
        phone: true,
        email: true,
        address: true,
        images: true,
        restaurant: { select: { priceRange: true } },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { reviewCount: 'desc' },
        { rating: 'desc' },
      ],
      take: limit * 3,
    });

    // Score de completude : prioriser les fiches completes
    const scored = raw.map((e: any) => {
      let score = 0;
      if (e.coverImage) score += 10;       // Image = top priority
      if (e.images) score += 5;            // Gallery
      if (e.description) score += 3;       // Description
      if (e.phone) score += 2;             // Contact
      if (e.email) score += 1;             // Email
      if (e.address) score += 1;           // Address
      if (e.isFeatured) score += 8;        // Featured
      if (e.rating > 0) score += 4;        // Has rating
      if (e.reviewCount > 0) score += 3;   // Has reviews
      return { ...e, _completeness: score };
    });

    // Sort by completeness then rating
    scored.sort((a: any, b: any) => b._completeness - a._completeness || b.rating - a.rating || b.reviewCount - a.reviewCount);

    const trending = scored.slice(0, limit);

    // Enrichir avec l'URL de la page
    const enriched = trending.map((e: any) => ({
      id: e.id, name: e.name, slug: e.slug, type: e.type, city: e.city,
      coverImage: e.coverImage, rating: e.rating, reviewCount: e.reviewCount,
      isFeatured: e.isFeatured,
      priceRange: e.restaurant?.priceRange || null,
      url: `/bons-plans/${e.type === 'HOTEL' ? 'hotels' : e.type === 'RESTAURANT' ? 'restaurants' : e.type === 'PROVIDER' ? 'prestataires' : 'attractions'}/${e.slug}`,
      shortDescription: e.description ? e.description.substring(0, 100) + (e.description.length > 100 ? '...' : '') : null,
    }));

    return NextResponse.json({ success: true, trending: enriched }, { headers: CACHE_HEADERS });
  } catch (error: unknown) {
    logger.error('[TRENDING] Error:', error);
    return apiError('Erreur serveur', 500);
  }
}
