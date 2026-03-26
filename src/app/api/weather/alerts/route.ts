import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' };

export async function GET() {
  try {
    const now = new Date();

    const alerts = await prisma.weatherAlert.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      orderBy: [
        { level: 'desc' },
        { startDate: 'desc' },
      ],
    });

    // Return the most critical alert as `alert` for backward compat + full list
    return NextResponse.json(
      { alert: alerts[0] || null, alerts },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    logger.error('Error fetching weather alerts:', error);
    return NextResponse.json({ alert: null, alerts: [] });
  }
}
