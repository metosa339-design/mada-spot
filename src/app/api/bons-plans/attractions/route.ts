import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeJsonParse } from '@/lib/api-response';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const attractionType = searchParams.get('type'); // park, museum, beach, waterfall, etc.
    const isFree = searchParams.get('free') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'rating';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const where: any = {
      isActive: true,
      type: 'ATTRACTION',
      moderationStatus: 'approved',
    };

    if (city) {
      where.city = city;
    }

    if (featured) {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by attraction-specific fields directly in the query
    const attractionWhere: any = {};
    if (attractionType) {
      attractionWhere.attractionType = attractionType;
    }
    if (isFree) {
      attractionWhere.isFree = true;
    }
    where.attraction = Object.keys(attractionWhere).length > 0
      ? attractionWhere
      : { isNot: null };

    const orderBy: any[] = [{ displayOrder: 'desc' }, { isFeatured: 'desc' }, { rating: 'desc' }];
    if (sortBy === 'price') {
      orderBy.unshift({ attraction: { entryFeeLocal: 'asc' } });
    }

    // Run both queries in parallel for speed
    const [filteredAttractions, total] = await Promise.all([
      prisma.establishment.findMany({
        where,
        select: {
          id: true, name: true, slug: true, shortDescription: true, description: true,
          city: true, district: true, region: true, coverImage: true, images: true,
          rating: true, reviewCount: true, isFeatured: true, latitude: true, longitude: true,
          attraction: {
            select: {
              attractionType: true, isFree: true, entryFeeForeign: true, entryFeeLocal: true,
              visitDuration: true, bestTimeToVisit: true, isAccessible: true, hasGuide: true,
              hasParking: true, highlights: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      prisma.establishment.count({ where }),
    ]);

    const transformedAttractions = filteredAttractions.map((attr) => ({
      id: attr.id,
      name: attr.name,
      slug: attr.slug,
      description: attr.shortDescription || attr.description,
      city: attr.city,
      district: attr.district,
      region: attr.region,
      coverImage: attr.coverImage,
      images: safeJsonParse(attr.images, []),
      rating: attr.rating,
      reviewCount: attr.reviewCount,
      isFeatured: attr.isFeatured,
      latitude: attr.latitude,
      longitude: attr.longitude,
      attractionType: attr.attraction?.attractionType,
      isFree: attr.attraction?.isFree,
      entryFeeForeign: attr.attraction?.entryFeeForeign,
      entryFeeLocal: attr.attraction?.entryFeeLocal,
      visitDuration: attr.attraction?.visitDuration,
      bestTimeToVisit: attr.attraction?.bestTimeToVisit,
      isAccessible: attr.attraction?.isAccessible,
      hasGuide: attr.attraction?.hasGuide,
      hasParking: attr.attraction?.hasParking,
      highlights: safeJsonParse(attr.attraction?.highlights, []),
    }));

    return NextResponse.json({
      attractions: transformedAttractions,
      total,
      hasMore: offset + transformedAttractions.length < total,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching attractions:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', attractions: [], total: 0 },
      { status: 500 }
    );
  }
}
