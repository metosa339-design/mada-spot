import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

// GET /api/bons-plans/map - Get all markers for the interactive map
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const types = searchParams.get('types'); // comma-separated: HOTEL,RESTAURANT,ATTRACTION
    const bounds = searchParams.get('bounds'); // "lat1,lng1,lat2,lng2" for map bounds filtering

    const typeList = types ? types.split(',').filter(t => ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER'].includes(t)) : [];

    let parsedBounds: { lat1: number; lng1: number; lat2: number; lng2: number } | null = null;
    if (bounds) {
      const [lat1, lng1, lat2, lng2] = bounds.split(',').map(parseFloat);
      if (!isNaN(lat1) && !isNaN(lng1) && !isNaN(lat2) && !isNaN(lng2)) {
        parsedBounds = { lat1, lng1, lat2, lng2 };
      }
    }

    // Fetch establishments
    const estWhere: any = {
      isActive: true,
      moderationStatus: 'approved',
      latitude: { not: null },
      longitude: { not: null },
    };

    if (city) estWhere.city = city;

    if (typeList.length > 0) {
      estWhere.type = { in: typeList };
    }

    if (parsedBounds) {
      estWhere.latitude = { gte: Math.min(parsedBounds.lat1, parsedBounds.lat2), lte: Math.max(parsedBounds.lat1, parsedBounds.lat2) };
      estWhere.longitude = { gte: Math.min(parsedBounds.lng1, parsedBounds.lng2), lte: Math.max(parsedBounds.lng1, parsedBounds.lng2) };
    }

    const establishments = await prisma.establishment.findMany({
      where: estWhere,
      select: {
        id: true, type: true, name: true, slug: true, city: true, district: true,
        latitude: true, longitude: true, coverImage: true, rating: true,
        reviewCount: true, isFeatured: true,
        hotel: { select: { starRating: true, roomTypes: { where: { isAvailable: true }, select: { pricePerNight: true }, orderBy: { pricePerNight: 'asc' }, take: 1 } } },
        restaurant: { select: { category: true, priceRange: true, avgMainCourse: true } },
        attraction: { select: { attractionType: true, isFree: true, entryFeeLocal: true } },
        provider: { select: { serviceType: true, priceRange: true, priceFrom: true } },
      },
      orderBy: { isFeatured: 'desc' },
    });

    const markers = establishments.map((est) => {
      let priceIndicator = null;
      let subtype = null;

      if (est.type === 'HOTEL') {
        priceIndicator = est.hotel?.roomTypes[0]?.pricePerNight
          ? `${Math.round(est.hotel.roomTypes[0].pricePerNight / 1000)}k Ar`
          : null;
        subtype = est.hotel?.starRating ? `${est.hotel.starRating} étoiles` : null;
      } else if (est.type === 'RESTAURANT') {
        priceIndicator = est.restaurant?.priceRange;
        subtype = est.restaurant?.category;
      } else if (est.type === 'ATTRACTION') {
        priceIndicator = est.attraction?.isFree
          ? 'Gratuit'
          : est.attraction?.entryFeeLocal
          ? `${Math.round(est.attraction.entryFeeLocal / 1000)}k Ar`
          : null;
        subtype = est.attraction?.attractionType;
      } else if (est.type === 'PROVIDER') {
        priceIndicator = est.provider?.priceFrom ? `${Math.round(est.provider.priceFrom / 1000)}k Ar` : null;
        subtype = est.provider?.serviceType;
      }

      return {
        id: est.id, type: est.type, name: est.name, slug: est.slug,
        city: est.city, district: est.district, latitude: est.latitude,
        longitude: est.longitude, coverImage: est.coverImage, rating: est.rating,
        reviewCount: est.reviewCount, isFeatured: est.isFeatured,
        priceIndicator, subtype,
      };
    });

    // Group by type for client-side filtering
    const grouped = {
      HOTEL: markers.filter((m) => m.type === 'HOTEL'),
      RESTAURANT: markers.filter((m) => m.type === 'RESTAURANT'),
      ATTRACTION: markers.filter((m) => m.type === 'ATTRACTION'),
      PROVIDER: markers.filter((m) => m.type === 'PROVIDER'),
    };

    return NextResponse.json({
      markers,
      grouped,
      total: markers.length,
      counts: {
        hotels: grouped.HOTEL.length,
        restaurants: grouped.RESTAURANT.length,
        attractions: grouped.ATTRACTION.length,
        providers: grouped.PROVIDER.length,
      },
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching map markers:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', markers: [], total: 0 },
      { status: 500 }
    );
  }
}
