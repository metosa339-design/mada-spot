// Mada Spot — Admin billetterie : actions d'urgence sur un billet.
// REGENERATE : nouveau QR + code (fraude / fuite). CANCEL : invalide et libère
// une place (billet non encore scanné). Journalisé.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { requireAdminSession, ensureCsrf } from '@/lib/ticketing/admin';
import { generateQrHash, generateUniqueSecurityCodes } from '@/lib/ticketing/codes';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  csrfToken: z.string().optional(),
  action: z.enum(['REGENERATE', 'CANCEL']),
});

// POST /api/admin/ticketing/tickets/[id]
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

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return apiError('Action invalide', 422);

  try {
    const ticket = await prisma.eventTicket.findUnique({
      where: { id },
      select: { id: true, ticketTypeId: true, isScanned: true, order: { select: { eventId: true } } },
    });
    if (!ticket) return apiError('Billet introuvable', 404);

    if (parsed.data.action === 'REGENERATE') {
      // Nouveau code à 6 chiffres unique au sein de l'événement.
      const existing = await prisma.eventTicket.findMany({
        where: { order: { eventId: ticket.order.eventId }, id: { not: id } },
        select: { securityCode: true },
      });
      const [newCode] = generateUniqueSecurityCodes(1, new Set(existing.map((e) => e.securityCode)));
      const updated = await prisma.eventTicket.update({
        where: { id },
        data: {
          qrHash: generateQrHash(),
          securityCode: newCode,
          // Un billet régénéré redevient valable (nouvel accès).
          isScanned: false,
          scannedAt: null,
          scannedById: null,
        },
        select: { securityCode: true, qrHash: true },
      });
      await logAudit({
        userId: auth.admin.id,
        action: 'TICKETING_TICKET_REGENERATE',
        entityType: 'EventTicket',
        entityId: id,
        ...getRequestMeta(request),
      });
      return NextResponse.json({
        success: true,
        data: { securityCode: updated.securityCode, qrHash: updated.qrHash },
      });
    }

    // CANCEL : seulement si le billet n'a pas été scanné.
    if (ticket.isScanned) {
      return apiError('Billet déjà scanné : annulation impossible', 409);
    }
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw(
        Prisma.sql`SELECT release_tickets(${ticket.ticketTypeId}::text, 1::int) AS ok`
      );
      await tx.eventTicket.delete({ where: { id } });
    });
    await logAudit({
      userId: auth.admin.id,
      action: 'TICKETING_TICKET_CANCEL',
      entityType: 'EventTicket',
      entityId: id,
      ...getRequestMeta(request),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('POST admin/ticketing/tickets/[id] a échoué', err, 'admin.ticketing');
    return apiError('Erreur serveur', 500);
  }
}
