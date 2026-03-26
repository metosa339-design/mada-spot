import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' };

// GET /api/history/leaders - Get historical figures (political leaders)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eraId = searchParams.get('era');

    // Build where clause
    const where: Record<string, unknown> = { isActive: true };
    if (eraId) where.eraId = eraId;

    const leaders = await prisma.historicalFigure.findMany({
      where,
      orderBy: { birthYear: 'asc' },
      include: {
        era: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      leaders,
      total: leaders.length,
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching leaders:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des dirigeants' },
      { status: 500 }
    );
  }
}
