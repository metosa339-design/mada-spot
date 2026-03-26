import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/establishments/[id]/fomo — Public FOMO data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const [recentViews, lastBooking] = await Promise.all([
      prisma.establishmentView.count({
        where: { establishmentId: id, createdAt: { gte: thirtyMinAgo } },
      }),
      prisma.booking.findFirst({
        where: { establishmentId: id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    let lastBookingAgo: string | null = null;
    if (lastBooking) {
      const diffMs = Date.now() - lastBooking.createdAt.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 60) lastBookingAgo = `${diffMin} min`;
      else if (diffMin < 1440) lastBookingAgo = `${Math.floor(diffMin / 60)}h`;
      else lastBookingAgo = `${Math.floor(diffMin / 1440)}j`;
    }

    return NextResponse.json({
      recentViews: Math.max(recentViews, 0),
      lastBookingAgo,
    });
  } catch {
    return NextResponse.json({ recentViews: 0, lastBookingAgo: null });
  }
}
