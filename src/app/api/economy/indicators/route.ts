import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { cachedQuery } from '@/lib/cache';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' };

// GET /api/economy/indicators - Get economic indicators
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // price, rate, export, import, gdp, inflation
    const category = searchParams.get('category'); // vanilla, coffee, rice, mining, tourism
    const slug = searchParams.get('slug');

    // If specific indicator requested
    if (slug) {
      const indicator = await db.economicIndicator.findUnique({
        where: { slug },
      });

      if (!indicator) {
        return NextResponse.json(
          { error: 'Indicator not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(indicator, { headers: CACHE_HEADERS });
    }

    // Build where clause
    const where: any = { isActive: true };
    if (type) where.type = type;
    if (category) where.category = category;

    const cacheKey = `economy:indicators:${type || 'all'}:${category || 'all'}`;
    const indicators: any = await cachedQuery(cacheKey, 3600, () =>
      db.economicIndicator.findMany({
        where,
        orderBy: { name: 'asc' },
      })
    );

    // Group by type
    const byType = {
      prices: indicators.filter((i: any) => i.type === 'price'),
      rates: indicators.filter((i: any) => i.type === 'rate'),
      macro: indicators.filter((i: any) => ['gdp', 'inflation', 'export', 'import'].includes(i.type)),
    };

    return NextResponse.json({
      indicators,
      byType,
      total: indicators.length,
      lastUpdated: indicators[0]?.lastUpdated || new Date(),
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching indicators:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des indicateurs' },
      { status: 500 }
    );
  }
}
