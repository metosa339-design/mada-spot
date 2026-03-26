import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { safeJsonParse } from '@/lib/api-response';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category'); // GARGOTE, RESTAURANT, LOUNGE, CAFE, FAST_FOOD
    const priceRange = searchParams.get('priceRange'); // BUDGET, MODERATE, UPSCALE, LUXURY
    const cuisine = searchParams.get('cuisine'); // malgache, francais, chinois, etc.
    const featured = searchParams.get('featured') === 'true';
    const hasDelivery = searchParams.get('hasDelivery') === 'true';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'rating';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const where: any = {
      isActive: true,
      type: 'RESTAURANT',
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

    // Filtres déplacés dans le WHERE Prisma (au lieu du filtrage JS côté client)
    const restaurantWhere: any = { isNot: null };
    if (category) restaurantWhere.category = category;
    if (priceRange) restaurantWhere.priceRange = priceRange;
    if (hasDelivery) restaurantWhere.hasDelivery = true;
    where.restaurant = restaurantWhere;

    const restaurants = await prisma.establishment.findMany({
      where,
      include: {
        restaurant: true,
      },
      orderBy:
        sortBy === 'price'
          ? { restaurant: { avgMainCourse: 'asc' } }
          : [{ displayOrder: 'desc' }, { isFeatured: 'desc' }, { rating: 'desc' }],
      skip: offset,
      take: limit,
    });

    // Post-filter cuisine (JSON field, can't filter in Prisma easily)
    let filteredRestaurants = restaurants.filter((resto) => {
      if (!resto.restaurant) return false;
      if (cuisine && resto.restaurant.cuisineTypes) {
        const cuisines = safeJsonParse<string[]>(resto.restaurant.cuisineTypes, []);
        if (!cuisines.includes(cuisine)) return false;
      }
      return true;
    });

    const transformedRestaurants = filteredRestaurants.map((resto) => ({
      id: resto.id,
      name: resto.name,
      slug: resto.slug,
      description: resto.shortDescription || resto.description,
      city: resto.city,
      district: resto.district,
      coverImage: resto.coverImage,
      images: safeJsonParse(resto.images, []),
      rating: resto.rating,
      reviewCount: resto.reviewCount,
      isFeatured: resto.isFeatured,
      latitude: resto.latitude,
      longitude: resto.longitude,
      phone: resto.phone,
      // Restaurant specific
      category: resto.restaurant?.category,
      cuisineTypes: safeJsonParse(resto.restaurant?.cuisineTypes, []),
      priceRange: resto.restaurant?.priceRange,
      avgMainCourse: resto.restaurant?.avgMainCourse,
      avgBeer: resto.restaurant?.avgBeer,
      hasDelivery: resto.restaurant?.hasDelivery,
      hasTakeaway: resto.restaurant?.hasTakeaway,
      hasReservation: resto.restaurant?.hasReservation,
      hasWifi: resto.restaurant?.hasWifi,
      // Menu-Scope
      ...(() => {
        const menuImgs = safeJsonParse(resto.restaurant?.menuImages, []);
        return { hasMenuImages: menuImgs.length > 0, menuImageCount: menuImgs.length };
      })(),
    }));

    const total = await prisma.establishment.count({
      where: { ...where, restaurant: { isNot: null } },
    });

    return NextResponse.json({
      restaurants: transformedRestaurants,
      total,
      hasMore: offset + transformedRestaurants.length < total,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', restaurants: [], total: 0 },
      { status: 500 }
    );
  }
}
