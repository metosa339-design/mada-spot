// Mada Spot — Admin billetterie : remboursement manuel d'une commande.
// Passe la commande en REFUNDED (billets non contrôlables car filtrés sur PAID)
// et rend les places au stock. Journalisé.

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { requireAdminSession, ensureCsrf } from '@/lib/ticketing/admin';

export const dynamic = 'force-dynamic';

// POST /api/admin/ticketing/orders/[id]/refund
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const csrf = ensureCsrf(body);
  if (csrf) return csrf;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.ticketOrder.findUnique({
        where: { id },
        select: { id: true, paymentStatus: true },
      });
      if (!order) return { kind: 'NOT_FOUND' as const };
      if (order.paymentStatus === 'REFUNDED') return { kind: 'ALREADY' as const };
      if (order.paymentStatus !== 'PAID') return { kind: 'NOT_PAID' as const };

      // Restitue les places au stock, par type de billet.
      const grouped = await tx.eventTicket.groupBy({
        by: ['ticketTypeId'],
        where: { orderId: id },
        _count: { _all: true },
      });
      for (const g of grouped) {
        await tx.$queryRaw(
          Prisma.sql`SELECT release_tickets(${g.ticketTypeId}::text, ${g._count._all}::int) AS ok`
        );
      }

      await tx.ticketOrder.update({ where: { id }, data: { paymentStatus: 'REFUNDED' } });
      return { kind: 'OK' as const };
    });

    if (result.kind === 'NOT_FOUND') return apiError('Commande introuvable', 404);
    if (result.kind === 'ALREADY') return apiError('Commande déjà remboursée', 409);
    if (result.kind === 'NOT_PAID') return apiError('Seule une commande payée peut être remboursée', 409);

    await logAudit({
      userId: auth.admin.id,
      action: 'TICKETING_REFUND',
      entityType: 'TicketOrder',
      entityId: id,
      ...getRequestMeta(request),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('POST admin/ticketing/orders/[id]/refund a échoué', err, 'admin.ticketing');
    return apiError('Erreur serveur', 500);
  }
}
