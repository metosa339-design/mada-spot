// Mada Spot — Billetterie : billets d'une commande payée (porte-monnaie PWA).
// L'id de commande (cuid non devinable) transmis par WhatsApp/SMS fait office
// de jeton d'accès au porte-monnaie anonyme.

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/ticketing/orders/[id]/tickets
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
        clientName: true,
        clientPhone: true,
        event: {
          select: { id: true, title: true, slug: true, startDate: true, location: true, city: true },
        },
        tickets: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            qrHash: true,
            securityCode: true,
            isScanned: true,
            scannedAt: true,
            isForResale: true,
            resalePrice: true,
            ticketType: { select: { id: true, name: true, priceMga: true } },
          },
        },
      },
    });

    if (!order) return apiError('Commande introuvable', 404);

    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { success: true, data: { status: order.paymentStatus, tickets: [] } },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        status: order.paymentStatus,
        orderId: order.id,
        clientName: order.clientName,
        clientPhone: order.clientPhone,
        event: order.event,
        tickets: order.tickets.map((t) => ({
          id: t.id,
          qrHash: t.qrHash,
          securityCode: t.securityCode,
          isScanned: t.isScanned,
          scannedAt: t.scannedAt,
          isForResale: t.isForResale,
          resalePrice: t.resalePrice ? t.resalePrice.toString() : null,
          category: t.ticketType.name,
          priceMga: t.ticketType.priceMga.toString(),
        })),
      },
    });
  } catch (err) {
    logger.error('GET /api/ticketing/orders/[id]/tickets a échoué', err, 'ticketing.api');
    return apiError('Erreur serveur', 500);
  }
}
