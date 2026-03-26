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

    const attractions = await prisma.establishment.findMany({
      where,
      include: {
        attraction: true,
      },
      orderBy: [{ displayOrder: 'desc' }, { isFeatured: 'desc' }, { rating: 'desc' }],
      skip: offset,
      take: limit * 2,
    });

    // Filter by attraction-specific fields
    let filteredAttractions = attractions.filter((attr) => {
      if (!attr.attraction) return false;

      if (attractionType && attr.attraction.attractionType !== attractionType) return false;
      if (isFree && !attr.attraction.isFree) return false;

      return true;
    });

    // Sort
    if (sortBy === 'price') {
      filteredAttractions.sort((a, b) => {
        const priceA = a.attraction?.entryFeeLocal || 0;
        const priceB = b.attraction?.entryFeeLocal || 0;
        return priceA - priceB;
      });
    }

    filteredAttractions = filteredAttractions.slice(0, limit);

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
      // Attraction specific
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

    const total = await prisma.establishment.count({
      where: { ...where, attraction: { isNot: null } },
    });

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
