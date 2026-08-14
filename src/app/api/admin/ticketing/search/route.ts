// Mada Spot — Admin billetterie : moteur de recherche universel (litiges).
// Retrouve une commande par téléphone, nom, code à 6 chiffres, référence de
// transaction ou identifiant de commande.

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireAdminSession } from '@/lib/ticketing/admin';

export const dynamic = 'force-dynamic';

// GET /api/admin/ticketing/search?q=
export async function GET(request: NextRequest) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;

  const q = new URL(request.url).searchParams.get('q')?.trim() || '';
  if (q.length < 2) return apiError('Requête trop courte', 400);

  try {
    const orderIds = new Set<string>();

    // Code de secours à 6 chiffres → billet → commande.
    if (/^\d{6}$/.test(q)) {
      const byCode = await prisma.eventTicket.findMany({
        where: { securityCode: q },
        select: { orderId: true },
        take: 50,
      });
      byCode.forEach((t) => orderIds.add(t.orderId));
    }

    const directOrders = await prisma.ticketOrder.findMany({
      where: {
        OR: [
          { id: q },
          { transactionRef: q },
          { clientPhone: { contains: q } },
          { clientName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true },
      take: 50,
    });
    directOrders.forEach((o) => orderIds.add(o.id));

    if (orderIds.size === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orders = await prisma.ticketOrder.findMany({
      where: { id: { in: [...orderIds] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        clientName: true,
        clientPhone: true,
        totalAmount: true,
        paymentStatus: true,
        paymentMethod: true,
        channelSource: true,
        transactionRef: true,
        createdAt: true,
        paidAt: true,
        event: { select: { title: true, slug: true, startDate: true } },
        tickets: {
          select: {
            id: true,
            securityCode: true,
            qrHash: true,
            isScanned: true,
            scannedAt: true,
            isForResale: true,
            ticketType: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: orders.map((o) => ({
        id: o.id,
        clientName: o.clientName,
        clientPhone: o.clientPhone,
        totalAmount: o.totalAmount.toString(),
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        channelSource: o.channelSource,
        transactionRef: o.transactionRef,
        createdAt: o.createdAt,
        paidAt: o.paidAt,
        eventTitle: o.event.title,
        eventSlug: o.event.slug,
        eventStartDate: o.event.startDate,
        tickets: o.tickets.map((t) => ({
          id: t.id,
          securityCode: t.securityCode,
          qrHash: t.qrHash,
          isScanned: t.isScanned,
          scannedAt: t.scannedAt,
          isForResale: t.isForResale,
          category: t.ticketType.name,
        })),
      })),
    });
  } catch (err) {
    logger.error('GET admin/ticketing/search a échoué', err, 'admin.ticketing');
    return apiError('Erreur serveur', 500);
  }
}
