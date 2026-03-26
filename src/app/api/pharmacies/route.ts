import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { cachedQuery } from '@/lib/cache';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const onGuard = searchParams.get('onGuard') === 'true';

    const where: any = {
      isActive: true,
    };

    if (city) {
      where.city = city;
    }

    if (onGuard) {
      where.isOnGuard = true;
    }

    const cacheKey = `pharmacies:${city || 'all'}:${onGuard}`;
    const { pharmacies, cities } = await cachedQuery(cacheKey, 3600, async () => {
      const [pharmacyList, cityList] = await Promise.all([
        db.pharmacy.findMany({
          where,
          orderBy: [
            { isOnGuard: 'desc' },
            { city: 'asc' },
            { name: 'asc' }
          ]
        }),
        db.pharmacy.findMany({
          where: { isActive: true },
          select: { city: true },
          distinct: ['city'],
          orderBy: { city: 'asc' }
        }),
      ]);
      return { pharmacies: pharmacyList, cities: cityList };
    });

    return NextResponse.json({
      success: true,
      pharmacies,
      cities: cities.map((c: any) => c.city)
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching pharmacies:', error);
    return NextResponse.json({ success: false, pharmacies: [], cities: [] }, { status: 500 });
  }
}
