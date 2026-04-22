import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeJsonParse } from '@/lib/api-response';
import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const serviceType = searchParams.get('serviceType');
    const priceRange = searchParams.get('priceRange');
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');
    searchParams.get('sortBy'); // reserved for future sort options
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const where: any = {
      isActive: true,
      type: 'PROVIDER',
      moderationStatus: 'approved',
    };

    if (city) where.city = city;
    if (featured) where.isFeatured = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const providerWhere: any = { isNot: null };
    if (serviceType) providerWhere.serviceType = serviceType;
    if (priceRange) providerWhere.priceRange = priceRange;
    where.provider = providerWhere;

    const [providers, total] = await Promise.all([
      prisma.establishment.findMany({
        where,
        include: {
          provider: true,
        },
        orderBy: [{ displayOrder: 'desc' }, { isFeatured: 'desc' }, { rating: 'desc' }],
        skip: offset,
        take: limit,
      }),
      prisma.establishment.count({ where: { ...where, provider: { isNot: null } } }),
    ]);

    const transformedProviders = providers
      .filter((p) => p.provider)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.shortDescription || p.description,
        city: p.city,
        district: p.district,
        coverImage: p.coverImage,
        images: safeJsonParse(p.images, []),
        rating: p.rating,
        reviewCount: p.reviewCount,
        isFeatured: p.isFeatured,
        latitude: p.latitude,
        longitude: p.longitude,
        phone: p.phone,
        serviceType: p.provider?.serviceType,
        languages: safeJsonParse(p.provider?.languages, []),
        experience: p.provider?.experience,
        priceRange: p.provider?.priceRange,
        priceFrom: p.provider?.priceFrom,
        priceTo: p.provider?.priceTo,
        priceUnit: p.provider?.priceUnit,
        isAvailable: p.provider?.isAvailable,
        operatingZone: safeJsonParse(p.provider?.operatingZone, []),
        vehicleType: p.provider?.vehicleType,
        vehicleCapacity: p.provider?.vehicleCapacity,
      }));

    return NextResponse.json({
      providers: transformedProviders,
      total,
      hasMore: offset + transformedProviders.length < total,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', providers: [], total: 0 },
      { status: 500 }
    );
  }
}
