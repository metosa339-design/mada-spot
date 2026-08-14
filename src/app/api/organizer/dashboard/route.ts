// Mada Spot — Organisateur : indicateurs de performance (KPIs).

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireOrganizer, getOrganizerBalance } from '@/lib/ticketing/organizer';

export const dynamic = 'force-dynamic';

// GET /api/organizer/dashboard
export async function GET(request: NextRequest) {
  const auth = await requireOrganizer(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.id;

  try {
    const ownedPaid = { paymentStatus: 'PAID' as const, event: { submittedByUserId: userId } };

    const [paidAgg, ticketsSold, capacityAgg, channels, eventsCount, balance] = await Promise.all([
      prisma.ticketOrder.aggregate({
        where: ownedPaid,
        _sum: { totalAmount: true, organizerNet: true, platformFee: true },
        _count: { _all: true },
      }),
      prisma.eventTicket.count({ where: { order: ownedPaid } }),
      prisma.ticketType.aggregate({
        where: { event: { submittedByUserId: userId } },
        _sum: { totalQuantity: true },
      }),
      prisma.ticketOrder.groupBy({
        by: ['channelSource'],
        where: ownedPaid,
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.event.count({ where: { submittedByUserId: userId } }),
      getOrganizerBalance(userId),
    ]);

    const capacity = capacityAgg._sum.totalQuantity ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        grossPaid: (paidAgg._sum.totalAmount ?? 0).toString(),
        organizerNet: (paidAgg._sum.organizerNet ?? 0).toString(),
        platformFees: (paidAgg._sum.platformFee ?? 0).toString(),
        ordersPaid: paidAgg._count._all,
        ticketsSold,
        capacity,
        fillRate: capacity > 0 ? Math.round((ticketsSold / capacity) * 100) : 0,
        eventsCount,
        channels: channels.map((c) => ({
          channel: c.channelSource,
          orders: c._count._all,
          amount: (c._sum.totalAmount ?? 0).toString(),
        })),
        balance,
      },
    });
  } catch (err) {
    logger.error('GET /api/organizer/dashboard a échoué', err, 'organizer.api');
    return apiError('Erreur serveur', 500);
  }
}
