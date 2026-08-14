// Mada Spot — Organisateur : liste des événements gérés + résumé des ventes.

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireOrganizer, ownedEventsWhere } from '@/lib/ticketing/organizer';

export const dynamic = 'force-dynamic';

// GET /api/organizer/events
export async function GET(request: NextRequest) {
  const auth = await requireOrganizer(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    // ADMIN voit tout ; ORGANIZER uniquement ses événements soumis.
    const where = user.role === 'ADMIN' ? {} : ownedEventsWhere(user.id);

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        city: true,
        status: true,
        coverImage: true,
        ticketTypes: {
          select: { id: true, totalQuantity: true, remainingQuantity: true, isActive: true },
        },
      },
      take: 200,
    });

    const eventIds = events.map((e) => e.id);

    // Résumé des ventes (commandes payées) par événement.
    const paidByEvent = eventIds.length
      ? await prisma.ticketOrder.groupBy({
          by: ['eventId'],
          where: { eventId: { in: eventIds }, paymentStatus: 'PAID' },
          _sum: { totalAmount: true, organizerNet: true },
        })
      : [];
    const soldByEvent = eventIds.length
      ? await prisma.eventTicket.groupBy({
          by: ['ticketTypeId'],
          where: { order: { eventId: { in: eventIds }, paymentStatus: 'PAID' } },
          _count: { _all: true },
        })
      : [];

    // Associe chaque ticketType à son event pour agréger les billets vendus.
    const typeToEvent = new Map<string, string>();
    for (const e of events) for (const t of e.ticketTypes) typeToEvent.set(t.id, e.id);
    const soldCount = new Map<string, number>();
    for (const s of soldByEvent) {
      const evId = typeToEvent.get(s.ticketTypeId);
      if (evId) soldCount.set(evId, (soldCount.get(evId) ?? 0) + s._count._all);
    }
    const paidMap = new Map(paidByEvent.map((p) => [p.eventId, p]));

    return NextResponse.json({
      success: true,
      data: events.map((e) => {
        const capacity = e.ticketTypes.reduce((s, t) => s + t.totalQuantity, 0);
        const remaining = e.ticketTypes.reduce((s, t) => s + t.remainingQuantity, 0);
        const sold = soldCount.get(e.id) ?? 0;
        const paid = paidMap.get(e.id);
        return {
          id: e.id,
          title: e.title,
          slug: e.slug,
          startDate: e.startDate,
          city: e.city,
          status: e.status,
          coverImage: e.coverImage,
          ticketTypeCount: e.ticketTypes.length,
          capacity,
          sold,
          fillRate: capacity > 0 ? Math.round((sold / capacity) * 100) : 0,
          reserved: capacity - remaining, // vendus + réservations en cours
          grossPaid: (paid?._sum.totalAmount ?? 0).toString(),
          organizerNet: (paid?._sum.organizerNet ?? 0).toString(),
        };
      }),
    });
  } catch (err) {
    logger.error('GET /api/organizer/events a échoué', err, 'organizer.api');
    return apiError('Erreur serveur', 500);
  }
}
