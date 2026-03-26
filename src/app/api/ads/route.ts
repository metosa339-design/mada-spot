import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const now = new Date();

    const where: any = {
      isActive: true,
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    };
    if (position) where.position = position;

    const ads = await prisma.advertisement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        position: true,
        format: true,
        imageUrl: true,
        linkUrl: true,
        altText: true,
      },
    });

    // Fire-and-forget: batch increment impressions
    if (ads.length > 0) {
      const ids = ads.map(a => a.id);
      prisma.advertisement.updateMany({
        where: { id: { in: ids } },
        data: { impressions: { increment: 1 } },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, ads }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching public ads:', error);
    return NextResponse.json({ success: true, ads: [] }, { headers: CACHE_HEADERS });
  }
}
