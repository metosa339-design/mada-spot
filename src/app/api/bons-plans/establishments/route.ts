import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { requireAdmin } from '@/lib/auth/middleware';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // HOTEL, RESTAURANT, ATTRACTION
    const city = searchParams.get('city');
    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const where: any = {
      isActive: true,
      moderationStatus: 'approved',
    };

    if (type) {
      where.type = type;
    }

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

    const establishments = await prisma.establishment.findMany({
      where,
      include: {
        hotel: {
          include: {
            roomTypes: {
              where: { isAvailable: true },
              orderBy: { pricePerNight: 'asc' },
              take: 1,
            },
          },
        },
        restaurant: true,
        attraction: true,
      },
      orderBy: [
        { isFeatured: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
      skip: offset,
      take: limit,
    });

    const total = await prisma.establishment.count({ where });

    // Transform data to include lowest price for hotels
    const transformedEstablishments = establishments.map((est) => {
      let lowestPrice = null;
      if (est.hotel && est.hotel.roomTypes.length > 0) {
        lowestPrice = est.hotel.roomTypes[0].pricePerNight;
      }
      return {
        ...est,
        lowestPrice,
      };
    });

    return NextResponse.json({
      establishments: transformedEstablishments,
      total,
      hasMore: offset + establishments.length < total,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching establishments:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', establishments: [], total: 0 },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Only admins can create establishments directly
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    const {
      type,
      name,
      slug,
      description,
      shortDescription,
      address,
      city,
      district,
      region,
      latitude,
      longitude,
      phone,
      email,
      website,
      facebook,
      whatsapp,
      coverImage,
      images,
      isFeatured,
      isPremium,
      // Type-specific data
      hotelData,
      restaurantData,
      attractionData,
    } = body;

    // Create establishment with type-specific relation
    const establishment = await prisma.establishment.create({
      data: {
        type,
        name,
        slug,
        description,
        shortDescription,
        address,
        city,
        district,
        region,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        phone,
        email,
        website,
        facebook,
        whatsapp,
        coverImage,
        images: images ? JSON.stringify(images) : null,
        isFeatured: isFeatured || false,
        isPremium: isPremium || false,
        ...(type === 'HOTEL' && hotelData
          ? {
              hotel: {
                create: {
                  starRating: hotelData.starRating,
                  hotelType: hotelData.hotelType,
                  amenities: hotelData.amenities ? JSON.stringify(hotelData.amenities) : null,
                  checkInTime: hotelData.checkInTime,
                  checkOutTime: hotelData.checkOutTime,
                },
              },
            }
          : {}),
        ...(type === 'RESTAURANT' && restaurantData
          ? {
              restaurant: {
                create: {
                  category: restaurantData.category,
                  cuisineTypes: restaurantData.cuisineTypes
                    ? JSON.stringify(restaurantData.cuisineTypes)
                    : null,
                  priceRange: restaurantData.priceRange,
                  menuImages: restaurantData.menuImages
                    ? JSON.stringify(restaurantData.menuImages)
                    : null,
                  openingHours: restaurantData.openingHours
                    ? JSON.stringify(restaurantData.openingHours)
                    : null,
                  hasDelivery: restaurantData.hasDelivery || false,
                  hasTakeaway: restaurantData.hasTakeaway || false,
                  hasReservation: restaurantData.hasReservation || false,
                  hasParking: restaurantData.hasParking || false,
                  hasWifi: restaurantData.hasWifi || false,
                  avgMainCourse: restaurantData.avgMainCourse,
                  avgBeer: restaurantData.avgBeer,
                },
              },
            }
          : {}),
        ...(type === 'ATTRACTION' && attractionData
          ? {
              attraction: {
                create: {
                  attractionType: attractionData.attractionType,
                  isFree: attractionData.isFree || false,
                  entryFeeForeign: attractionData.entryFeeForeign,
                  entryFeeLocal: attractionData.entryFeeLocal,
                  visitDuration: attractionData.visitDuration,
                  bestTimeToVisit: attractionData.bestTimeToVisit,
                  isAccessible: attractionData.isAccessible || false,
                  hasGuide: attractionData.hasGuide || false,
                  hasParking: attractionData.hasParking || false,
                },
              },
            }
          : {}),
      },
      include: {
        hotel: true,
        restaurant: true,
        attraction: true,
      },
    });

    return NextResponse.json({ establishment }, { status: 201 });
  } catch (error) {
    logger.error('Error creating establishment:', error);
    return apiError('Erreur serveur', 500);
  }
}
