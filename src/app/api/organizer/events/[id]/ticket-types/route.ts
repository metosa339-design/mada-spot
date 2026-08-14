// Mada Spot — Organisateur : types de billets d'un événement (liste + création).

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireOrganizer, canManageEvent } from '@/lib/ticketing/organizer';
import { createTicketTypeSchema } from '@/lib/validations/ticketing';

export const dynamic = 'force-dynamic';

// GET /api/organizer/events/[id]/ticket-types
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOrganizer(request);
  if (auth instanceof NextResponse) return auth;
  const { id: eventId } = await params;

  if (!(await canManageEvent(auth.user, eventId))) return apiError('Accès refusé', 403);

  try {
    const types = await prisma.ticketType.findMany({
      where: { eventId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        priceMga: true,
        totalQuantity: true,
        remainingQuantity: true,
        maxPerOrder: true,
        salesEnd: true,
        isActive: true,
      },
    });

    // Nombre de billets vendus (commandes payées) par type.
    const sold = types.length
      ? await prisma.eventTicket.groupBy({
          by: ['ticketTypeId'],
          where: { ticketTypeId: { in: types.map((t) => t.id) }, order: { paymentStatus: 'PAID' } },
          _count: { _all: true },
        })
      : [];
    const soldMap = new Map(sold.map((s) => [s.ticketTypeId, s._count._all]));

    return NextResponse.json({
      success: true,
      data: types.map((t) => ({
        id: t.id,
        name: t.name,
        priceMga: t.priceMga.toString(),
        totalQuantity: t.totalQuantity,
        remainingQuantity: t.remainingQuantity,
        maxPerOrder: t.maxPerOrder,
        salesEnd: t.salesEnd,
        isActive: t.isActive,
        sold: soldMap.get(t.id) ?? 0,
      })),
    });
  } catch (err) {
    logger.error('GET ticket-types a échoué', err, 'organizer.api');
    return apiError('Erreur serveur', 500);
  }
}

// POST /api/organizer/events/[id]/ticket-types
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOrganizer(request);
  if (auth instanceof NextResponse) return auth;
  const { id: eventId } = await params;

  if (!(await canManageEvent(auth.user, eventId))) return apiError('Accès refusé', 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }
  const parsed = createTicketTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const input = parsed.data;

  try {
    const created = await prisma.ticketType.create({
      data: {
        eventId,
        name: input.name,
        priceMga: new Prisma.Decimal(input.priceMga),
        totalQuantity: input.totalQuantity,
        remainingQuantity: input.totalQuantity,
        maxPerOrder: input.maxPerOrder,
        salesEnd: input.salesEnd ? new Date(input.salesEnd) : null,
      },
      select: { id: true },
    });
    return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 });
  } catch (err) {
    logger.error('POST ticket-types a échoué', err, 'organizer.api');
    return apiError('Erreur serveur', 500);
  }
}
