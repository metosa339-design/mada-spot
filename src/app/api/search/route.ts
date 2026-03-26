import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { apiError, getErrorMessage } from '@/lib/api-response';
import { logger } from '@/lib/logger';

// GET /api/search - Advanced search with filters
// Query params: q, type, city, region, minRating, priceRange, amenities (comma-sep), sortBy, limit, offset
export async function GET(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, 'read');
  if (!rateLimit.success) {
    return new NextResponse(
      JSON.stringify({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...getRateLimitHeaders(rateLimit) },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const type = searchParams.get('type')?.trim() || '';
  const city = searchParams.get('city')?.trim() || '';
  const region = searchParams.get('region')?.trim() || '';
  const minRating = searchParams.get('minRating')?.trim() || '';
  const priceRange = searchParams.get('priceRange')?.trim() || '';
  const amenities = searchParams.get('amenities')?.trim() || '';
  const sortBy = searchParams.get('sortBy')?.trim() || 'relevance';
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '12', 10) || 12, 1), 50);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

  try {
    // Build dynamic where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      isActive: true,
      archivedAt: null,
    };

    // Text search: OR across name, city, description, address, region
    if (q && q.length >= 1) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { region: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Type filter
    const validTypes = ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'];
    if (type && validTypes.includes(type.toUpperCase())) {
      where.type = type.toUpperCase();
    }

    // City filter
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    // Region filter
    if (region) {
      where.region = { contains: region, mode: 'insensitive' };
    }

    // Minimum rating filter
    if (minRating) {
      const parsedRating = parseFloat(minRating);
      if (!isNaN(parsedRating) && parsedRating > 0) {
        where.rating = { gte: parsedRating };
      }
    }

    // Price range filter (applies to restaurants and providers)
    if (priceRange) {
      const validPriceRanges = ['BUDGET', 'MODERATE', 'UPSCALE', 'LUXURY'];
      if (validPriceRanges.includes(priceRange.toUpperCase())) {
        // Only apply if type is RESTAURANT, or not specified
        if (!type || type.toUpperCase() === 'RESTAURANT') {
          where.restaurant = { priceRange: priceRange.toUpperCase() };
        }
      }
    }

    // Amenities filter (for hotels with JSON amenities field)
    if (amenities) {
      const amenityList = amenities.split(',').map((a) => a.trim()).filter(Boolean);
      if (amenityList.length > 0) {
        where.hotel = {
          ...where.hotel,
          AND: amenityList.map((amenity) => ({
            amenities: { path: [], string_contains: amenity },
          })),
        };
      }
    }

    // Build orderBy based on sortBy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let orderBy: any[];
    switch (sortBy) {
      case 'rating':
        orderBy = [{ isFeatured: 'desc' }, { rating: 'desc' }];
        break;
      case 'reviewCount':
        orderBy = [{ reviewCount: 'desc' }];
        break;
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      default: // relevance
        orderBy = [{ isFeatured: 'desc' }, { rating: 'desc' }];
        break;
    }

    // Execute findMany + count in parallel
    const [establishments, totalCount] = await Promise.all([
      prisma.establishment.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          city: true,
          region: true,
          coverImage: true,
          rating: true,
          reviewCount: true,
          shortDescription: true,
          isFeatured: true,
          isPremium: true,
          hotel: {
            select: { starRating: true },
          },
          restaurant: {
            select: { priceRange: true, category: true },
          },
          attraction: {
            select: { attractionType: true, isFree: true },
          },
          provider: {
            select: { serviceType: true },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.establishment.count({ where }),
    ]);

    const response = NextResponse.json({
      success: true,
      establishments,
      totalCount,
      pagination: {
        offset,
        limit,
        hasMore: offset + limit < totalCount,
      },
    });

    // Log search query (fire-and-forget)
    if (q) {
      prisma.searchLog.create({
        data: {
          query: q,
          resultCount: totalCount,
          filters: JSON.stringify({ type, city, region, minRating, priceRange }),
        },
      }).catch(() => {});
    }

    // Cache for 5 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return response;
  } catch (error: unknown) {
    logger.error('[SEARCH] Error:', error as Error);
    return apiError(getErrorMessage(error), 500);
  }
}
