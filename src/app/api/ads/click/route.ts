import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false }, { status: 400 });

    // Support both { id } (AdSidebar) and { adId } (TopAdBanner)
    const adId = body.id || body.adId;
    if (!adId || typeof adId !== 'string') {
      return NextResponse.json({ success: false, error: 'id manquant' }, { status: 400 });
    }

    await prisma.advertisement.update({
      where: { id: adId },
      data: { clicks: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error tracking ad click:', error);
    return NextResponse.json({ success: true });
  }
}
