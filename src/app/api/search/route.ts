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

    // Type filter — tolérant aux alias (pluriel, minuscule, clés d'onglet du hero)
    const TYPE_ALIASES: Record<string, string> = {
      hotel: 'HOTEL', hotels: 'HOTEL', hebergement: 'HOTEL', hebergements: 'HOTEL',
      restaurant: 'RESTAURANT', restaurants: 'RESTAURANT',
      attraction: 'ATTRACTION', attractions: 'ATTRACTION', activite: 'ATTRACTION', activites: 'ATTRACTION',
      provider: 'PROVIDER', providers: 'PROVIDER', guide: 'PROVIDER', guides: 'PROVIDER',
      prestataire: 'PROVIDER', prestataires: 'PROVIDER',
    };
    const normType = type ? (TYPE_ALIASES[type.toLowerCase()] || type.toUpperCase()) : '';
    if (normType && ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'].includes(normType)) {
      where.type = normType;
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

    // Champs sélectionnés — réutilisés par la requête de repli (fallback)
    const selectFields = {
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
      hotel: { select: { starRating: true } },
      restaurant: { select: { priceRange: true, category: true } },
      attraction: { select: { attractionType: true, isFree: true } },
      provider: { select: { serviceType: true } },
    };

    // Execute findMany + count in parallel
    // eslint-disable-next-line prefer-const
    let [establishments, totalCount] = await Promise.all([
      prisma.establishment.findMany({
        where,
        select: selectFields,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.establishment.count({ where }),
    ]);

    // Re-sort by completeness: prioritize establishments with images and complete profiles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const byCompleteness = (a: any, b: any) => {
      const scoreA = (a.coverImage ? 10 : 0) + (a.rating > 0 ? 2 : 0) + (a.isFeatured ? 5 : 0);
      const scoreB = (b.coverImage ? 10 : 0) + (b.rating > 0 ? 2 : 0) + (b.isFeatured ? 5 : 0);
      return scoreB - scoreA;
    };
    establishments.sort(byCompleteness);

    // --- Repli (fallback) : ville + catégorie sans aucun résultat ---
    // Évite la page vide. On élargit : d'abord les mêmes établissements dans la
    // région de la ville demandée, sinon une sélection populaire de la catégorie.
    let fallback:
      | { applied: true; scope: 'region' | 'popular'; city: string; region: string | null }
      | null = null;
    if (totalCount === 0 && city && offset === 0) {
      // Région de la ville demandée (déduite d'une fiche portant ce nom de ville)
      const cityRow = await prisma.establishment.findFirst({
        where: {
          isActive: true,
          archivedAt: null,
          city: { contains: city, mode: 'insensitive' },
          NOT: { region: null },
        },
        select: { region: true },
      });
      const fbRegion = cityRow?.region || region || '';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fbWhere: any = { isActive: true, archivedAt: null };
      if (normType) fbWhere.type = normType;

      let scope: 'region' | 'popular' = 'popular';
      if (fbRegion) {
        fbWhere.region = { contains: fbRegion, mode: 'insensitive' };
        scope = 'region';
      }

      let fbResults = await prisma.establishment.findMany({
        where: fbWhere,
        select: selectFields,
        orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
        take: limit,
      });

      // Rien dans la région → on élargit aux plus populaires de la catégorie
      if (fbResults.length === 0 && fbRegion) {
        delete fbWhere.region;
        scope = 'popular';
        fbResults = await prisma.establishment.findMany({
          where: fbWhere,
          select: selectFields,
          orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
          take: limit,
        });
      }

      if (fbResults.length > 0) {
        fbResults.sort(byCompleteness);
        establishments = fbResults;
        totalCount = fbResults.length;
        fallback = { applied: true, scope, city, region: scope === 'region' ? fbRegion : null };
      }
    }

    const response = NextResponse.json({
      success: true,
      establishments,
      totalCount,
      fallback,
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
