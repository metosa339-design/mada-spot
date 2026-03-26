import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/establishments/[id]/promotions — Public active promotions
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const now = new Date();

    const promotions = await prisma.promotion.findMany({
      where: {
        establishmentId: id,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      select: {
        title: true,
        description: true,
        discountPercent: true,
        startDate: true,
        endDate: true,
      },
      orderBy: { endDate: 'asc' },
    });

    return NextResponse.json({
      promotions: promotions.map(p => ({
        title: p.title,
        description: p.description || '',
        discountPercent: p.discountPercent,
        startDate: p.startDate.toISOString(),
        endDate: p.endDate.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ promotions: [] });
  }
}
