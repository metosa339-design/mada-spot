// Mada Spot — Billetterie : statut d'une commande (polling écran d'attente USSD).

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/ticketing/orders/[id] — statut minimal (l'id cuid fait office de jeton).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const order = await prisma.ticketOrder.findUnique({
      where: { id },
      select: {
        id: true,
        paymentStatus: true,
        totalAmount: true,
        paymentMethod: true,
        expiresAt: true,
        paidAt: true,
        event: { select: { title: true, slug: true } },
        _count: { select: { tickets: true } },
      },
    });
    if (!order) return apiError('Commande introuvable', 404);

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        status: order.paymentStatus,
        totalAmount: order.totalAmount.toString(),
        paymentMethod: order.paymentMethod,
        expiresAt: order.expiresAt,
        paidAt: order.paidAt,
        eventTitle: order.event.title,
        eventSlug: order.event.slug,
        ticketCount: order._count.tickets,
      },
    });
  } catch (err) {
    logger.error('GET /api/ticketing/orders/[id] a échoué', err, 'ticketing.api');
    return apiError('Erreur serveur', 500);
  }
}
