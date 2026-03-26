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
    const type = searchParams.get('type');

    const where: any = {
      isActive: true,
    };

    if (city) {
      where.city = city;
    }

    if (type) {
      where.type = type;
    }

    const cacheKey = `emergency:${city || 'all'}:${type || 'all'}`;
    const { contacts, cities } = await cachedQuery(cacheKey, 3600, async () => {
      const [contactList, cityList] = await Promise.all([
        db.emergencyContact.findMany({
          where,
          orderBy: [
            { order: 'asc' },
            { type: 'asc' },
            { name: 'asc' }
          ]
        }),
        db.emergencyContact.findMany({
          where: { isActive: true },
          select: { city: true },
          distinct: ['city'],
          orderBy: { city: 'asc' }
        }),
      ]);
      return { contacts: contactList, cities: cityList };
    });

    return NextResponse.json({
      success: true,
      contacts,
      cities: cities.map((c: any) => c.city)
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching emergency contacts:', error);
    return NextResponse.json({ success: false, contacts: [], cities: [] }, { status: 500 });
  }
}
