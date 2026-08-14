// Mada Spot — Billetterie : mise en revente sécurisée d'un billet (1 clic).
// Revente au prix d'achat officiel uniquement (anti-spéculation). L'accès est
// autorisé par la possession de l'id de commande (jeton du porte-monnaie).

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  orderId: z.string().min(1),
  forResale: z.boolean(),
});

// POST /api/ticketing/tickets/[id]/resale
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const ticket = await prisma.eventTicket.findUnique({
      where: { id },
      select: {
        id: true,
        orderId: true,
        isScanned: true,
        order: { select: { paymentStatus: true } },
        ticketType: { select: { priceMga: true } },
      },
    });

    if (!ticket) return apiError('Billet introuvable', 404);
    // Autorisation par possession du jeton de commande.
    if (ticket.orderId !== parsed.data.orderId) return apiError('Accès refusé', 403);
    if (ticket.order.paymentStatus !== 'PAID') return apiError('Billet non payé', 409);
    if (ticket.isScanned) return apiError('Billet déjà utilisé : revente impossible', 409);

    const updated = await prisma.eventTicket.update({
      where: { id },
      data: {
        isForResale: parsed.data.forResale,
        // Prix officiel imposé à l'activation, effacé à la désactivation.
        resalePrice: parsed.data.forResale ? ticket.ticketType.priceMga : null,
      },
      select: { id: true, isForResale: true, resalePrice: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        isForResale: updated.isForResale,
        resalePrice: updated.resalePrice ? updated.resalePrice.toString() : null,
      },
    });
  } catch (err) {
    logger.error('POST /api/ticketing/tickets/[id]/resale a échoué', err, 'ticketing.api');
    return apiError('Erreur serveur', 500);
  }
}
