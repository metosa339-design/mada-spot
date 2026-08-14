// Mada Spot — Billetterie : création d'une commande (Achat Express).

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { createOrderSchema } from '@/lib/validations/ticketing';
import { createExpressOrder } from '@/lib/ticketing/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/ticketing/orders — réserve les billets et crée une commande PENDING.
export async function POST(request: NextRequest) {
  const rl = checkRateLimit(getClientIdentifier(request), 'write');
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: 'Trop de tentatives. Réessayez dans un instant.' },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const result = await createExpressOrder(parsed.data);
    if (!result.ok) {
      // 409 pour les conflits de stock/vente, 400 pour données invalides.
      const status = result.code === 'INTERNAL' ? 500 : result.code === 'SOLD_OUT' ? 409 : 400;
      return NextResponse.json(
        { success: false, error: result.message, code: result.code, ticketTypeId: result.ticketTypeId },
        { status }
      );
    }
    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: result.orderId,
          reused: result.reused,
          expiresAt: result.expiresAt,
          totalAmount: result.totalAmount,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error('POST /api/ticketing/orders a échoué', err, 'ticketing.api');
    return apiError('Erreur serveur', 500);
  }
}
