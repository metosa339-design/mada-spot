// Mada Spot — Admin billetterie : analytics plateforme (GMV, commissions, flux).

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireAdminSession } from '@/lib/ticketing/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/ticketing/analytics
export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const paid = { paymentStatus: 'PAID' as const };

    const [totals, tickets, byMethod, byChannel, pendingPayouts, posVendors] = await Promise.all([
      prisma.ticketOrder.aggregate({
        where: paid,
        _sum: { totalAmount: true, platformFee: true, posFee: true, organizerNet: true },
        _count: { _all: true },
      }),
      prisma.eventTicket.count({ where: { order: paid } }),
      prisma.ticketOrder.groupBy({
        by: ['paymentMethod'],
        where: paid,
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.ticketOrder.groupBy({
        by: ['channelSource'],
        where: paid,
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.payoutRequest.aggregate({
        where: { status: { in: ['PENDING', 'APPROVED'] } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.user.count({ where: { role: 'POS_VENDOR' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        gmv: (totals._sum.totalAmount ?? 0).toString(),
        platformCommissions: (totals._sum.platformFee ?? 0).toString(),
        posCommissions: (totals._sum.posFee ?? 0).toString(),
        organizerNet: (totals._sum.organizerNet ?? 0).toString(),
        ordersPaid: totals._count._all,
        ticketsSold: tickets,
        posVendors,
        pendingPayouts: {
          count: pendingPayouts._count._all,
          amount: (pendingPayouts._sum.amount ?? 0).toString(),
        },
        byOperator: byMethod.map((m) => ({
          method: m.paymentMethod,
          orders: m._count._all,
          amount: (m._sum.totalAmount ?? 0).toString(),
        })),
        byChannel: byChannel.map((c) => ({
          channel: c.channelSource,
          orders: c._count._all,
          amount: (c._sum.totalAmount ?? 0).toString(),
        })),
      },
    });
  } catch (err) {
    logger.error('GET admin/ticketing/analytics a échoué', err, 'admin.ticketing');
    return apiError('Erreur serveur', 500);
  }
}
