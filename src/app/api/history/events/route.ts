import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' };

// GET /api/history/events - Get historical events with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eraId = searchParams.get('era');
    const year = searchParams.get('year');
    const startYear = searchParams.get('startYear');
    const endYear = searchParams.get('endYear');
    const featured = searchParams.get('featured') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      isActive: true,
      isMadagascar: true,
    };

    if (eraId) where.eraId = eraId;
    if (year) where.year = parseInt(year);
    if (featured) where.isFeatured = true;

    if (startYear && endYear) {
      where.year = {
        gte: parseInt(startYear),
        lte: parseInt(endYear),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch events
    const [events, total] = await Promise.all([
      prisma.historicalEvent.findMany({
        where,
        orderBy: { year: 'asc' },
        take: limit,
        skip: offset,
        include: {
          era: {
            select: { name: true, slug: true },
          },
        },
      }),
      prisma.historicalEvent.count({ where }),
    ]);

    return NextResponse.json({
      events,
      total,
      limit,
      offset,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des événements' },
      { status: 500 }
    );
  }
}
