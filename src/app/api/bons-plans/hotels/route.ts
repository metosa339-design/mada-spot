import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeJsonParse } from '@/lib/api-response';
import { cachedQuery } from '@/lib/cache';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const minStars = searchParams.get('minStars');
    const maxPrice = searchParams.get('maxPrice');
    const minPrice = searchParams.get('minPrice');
    const amenities = searchParams.get('amenities'); // comma-separated
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'rating'; // rating, price, stars
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const where: any = {
      isActive: true,
      type: 'HOTEL',
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
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtres déplacés dans le WHERE Prisma (au lieu du filtrage JS côté client)
    const hotelWhere: any = { isNot: null };
    if (minStars) {
      hotelWhere.starRating = { gte: parseInt(minStars) };
    }
    where.hotel = hotelWhere;

    // Price filter via roomTypes
    if (minPrice || maxPrice) {
      const priceFilter: any = { isAvailable: true };
      if (minPrice) priceFilter.pricePerNight = { ...priceFilter.pricePerNight, gte: parseFloat(minPrice) };
      if (maxPrice) priceFilter.pricePerNight = { ...priceFilter.pricePerNight, lte: parseFloat(maxPrice) };
      where.hotel.roomTypes = { some: priceFilter };
    }

    const cacheKey = `hotels:${city}:${minStars}:${amenities}:${minPrice}:${maxPrice}:${search}:${sortBy}:${limit}:${offset}`;

    const [hotels, total] = await cachedQuery(cacheKey, 600, () => Promise.all([
      prisma.establishment.findMany({
        where,
        include: {
          hotel: {
            include: {
              roomTypes: {
                where: { isAvailable: true },
                orderBy: { pricePerNight: 'asc' },
              },
            },
          },
          reviews: {
            where: { isPublished: true },
            select: { rating: true, comment: true, authorName: true },
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy:
          sortBy === 'stars'
            ? { hotel: { starRating: 'desc' } }
            : [{ displayOrder: 'desc' }, { isFeatured: 'desc' }, { rating: 'desc' }],
        skip: offset,
        take: limit,
      }),
      prisma.establishment.count({ where: { ...where, hotel: { isNot: null } } }),
    ])) as [any[], number];

    // Post-filter amenities (JSON field, can't filter in Prisma easily)
    let filteredHotels = hotels.filter((hotel) => {
      if (!hotel.hotel) return false;
      if (amenities && hotel.hotel.amenities) {
        const hotelAmenities = safeJsonParse<string[]>(hotel.hotel.amenities, []);
        const requiredAmenities = amenities.split(',');
        if (!requiredAmenities.every((a: string) => hotelAmenities.includes(a))) {
          return false;
        }
      }
      return true;
    });

    // Sort by price if needed (requires JS sort since price is in related roomTypes)
    if (sortBy === 'price') {
      filteredHotels.sort((a, b) => {
        const priceA = a.hotel?.roomTypes[0]?.pricePerNight || Infinity;
        const priceB = b.hotel?.roomTypes[0]?.pricePerNight || Infinity;
        return priceA - priceB;
      });
    }

    // Transform for response
    const transformedHotels = filteredHotels.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      description: hotel.shortDescription || hotel.description,
      city: hotel.city,
      district: hotel.district,
      coverImage: hotel.coverImage,
      images: safeJsonParse(hotel.images, []),
      rating: hotel.rating,
      reviewCount: hotel.reviewCount,
      isFeatured: hotel.isFeatured,
      isPremium: hotel.isPremium,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      // Hotel specific
      starRating: hotel.hotel?.starRating,
      hotelType: hotel.hotel?.hotelType,
      amenities: safeJsonParse(hotel.hotel?.amenities, []),
      checkInTime: hotel.hotel?.checkInTime,
      checkOutTime: hotel.hotel?.checkOutTime,
      // Price info
      lowestPrice: hotel.hotel?.roomTypes[0]?.pricePerNight || null,
      roomCount: hotel.hotel?.roomTypes.length || 0,
      // Recent reviews preview
      recentReviews: hotel.reviews.map((r: any) => ({
        rating: r.rating,
        comment: (r.comment || '').substring(0, 100),
        authorName: r.authorName,
      })),
    }));

    return NextResponse.json({
      hotels: transformedHotels,
      total,
      hasMore: offset + transformedHotels.length < total,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching hotels:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', hotels: [], total: 0 },
      { status: 500 }
    );
  }
}
