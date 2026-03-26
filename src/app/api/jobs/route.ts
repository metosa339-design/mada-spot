import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;

import { logger } from '@/lib/logger';

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' };

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);

    const jobs = await db.job.findMany({
      where: { isActive: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        company: true,
        companyLogo: true,
      }
    });

    return NextResponse.json({
      success: true,
      jobs
    }, { headers: CACHE_HEADERS });
  } catch (error) {
    logger.error('Error fetching jobs:', error);
    return NextResponse.json({ success: false, jobs: [] }, { status: 500 });
  }
}
