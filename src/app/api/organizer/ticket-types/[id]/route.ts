// Mada Spot — Organisateur : mise à jour / suppression d'un type de billet.

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireOrganizer, canManageEvent } from '@/lib/ticketing/organizer';
import { updateTicketTypeSchema } from '@/lib/validations/ticketing';

export const dynamic = 'force-dynamic';

async function loadOwnedType(
  request: NextRequest,
  id: string
): Promise<{ eventId: string } | NextResponse> {
  const auth = await requireOrganizer(request);
  if (auth instanceof NextResponse) return auth;

  const type = await prisma.ticketType.findUnique({
    where: { id },
    select: { eventId: true },
  });
  if (!type) return apiError('Type de billet introuvable', 404);
  if (!(await canManageEvent(auth.user, type.eventId))) return apiError('Accès refusé', 403);
  return { eventId: type.eventId };
}

// PATCH /api/organizer/ticket-types/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const owned = await loadOwnedType(request, id);
  if (owned instanceof NextResponse) return owned;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }
  const parsed = updateTicketTypeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const input = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // Verrou de la ligne pour éviter toute course avec une réservation.
      const rows = await tx.$queryRaw<{ totalQuantity: number; remainingQuantity: number }[]>(
        Prisma.sql`SELECT "totalQuantity", "remainingQuantity" FROM "TicketType" WHERE "id" = ${id} FOR UPDATE`
      );
      if (!rows[0]) throw new NotFoundError();

      const data: Prisma.TicketTypeUpdateInput = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.priceMga !== undefined) data.priceMga = new Prisma.Decimal(input.priceMga);
      if (input.maxPerOrder !== undefined) data.maxPerOrder = input.maxPerOrder;
      if (input.isActive !== undefined) data.isActive = input.isActive;
      if (input.salesEnd !== undefined) {
        data.salesEnd = input.salesEnd ? new Date(input.salesEnd) : null;
      }

      if (input.totalQuantity !== undefined) {
        // committed = places déjà vendues ou réservées (non libérables ici).
        const committed = rows[0].totalQuantity - rows[0].remainingQuantity;
        if (input.totalQuantity < committed) {
          throw new QuantityTooLowError(committed);
        }
        data.totalQuantity = input.totalQuantity;
        data.remainingQuantity = input.totalQuantity - committed;
      }

      await tx.ticketType.update({ where: { id }, data });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof NotFoundError) return apiError('Type de billet introuvable', 404);
    if (err instanceof QuantityTooLowError) {
      return NextResponse.json(
        { success: false, error: `Quantité inférieure aux ${err.committed} places déjà engagées.` },
        { status: 409 }
      );
    }
    logger.error('PATCH ticket-types a échoué', err, 'organizer.api');
    return apiError('Erreur serveur', 500);
  }
}

// DELETE /api/organizer/ticket-types/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const owned = await loadOwnedType(request, id);
  if (owned instanceof NextResponse) return owned;

  try {
    const usage = await prisma.eventTicket.count({ where: { ticketTypeId: id } });
    if (usage > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Des billets existent déjà pour ce type. Désactivez-le plutôt que de le supprimer.',
        },
        { status: 409 }
      );
    }
    await prisma.ticketType.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('DELETE ticket-types a échoué', err, 'organizer.api');
    return apiError('Erreur serveur', 500);
  }
}

class NotFoundError extends Error {}
class QuantityTooLowError extends Error {
  constructor(public committed: number) {
    super('quantity too low');
  }
}
