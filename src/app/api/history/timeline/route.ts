import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { cachedQuery } from '@/lib/cache';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' };

// GET /api/history/timeline - Get all historical eras with events
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeEvents = searchParams.get('events') === 'true';
    const eraSlug = searchParams.get('era');

    // If specific era requested
    if (eraSlug) {
      const era = await db.historicalEra.findUnique({
        where: { slug: eraSlug },
        include: {
          events: {
            where: { isActive: true },
            orderBy: { year: 'asc' },
          },
          figures: {
            where: { isActive: true },
            orderBy: { birthYear: 'asc' },
          },
        },
      });

      if (!era) {
        return NextResponse.json(
          { error: 'Era not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(era, { headers: CACHE_HEADERS });
    }

    // Get all eras
    const cacheKey = `history:timeline:${includeEvents}`;
    const eras: any = await cachedQuery(cacheKey, 3600, () =>
      db.historicalEra.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
        include: includeEvents ? {
          events: {
            where: { isActive: true, isFeatured: true },
            orderBy: { year: 'asc' },
            take: 5,
          },
          _count: {
            select: { events: true, figures: true },
          },
        } : {
          _count: {
            select: { events: true, figures: true },
          },
        },
      })
    );

    return NextResponse.json({
      eras,
      count: eras.length,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la timeline' },
      { status: 500 }
    );
  }
}
