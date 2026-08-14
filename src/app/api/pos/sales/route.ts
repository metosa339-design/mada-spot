// Mada Spot — POS : enregistrement d'une vente au guichet (espèces).

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { getAuthUser } from '@/lib/auth';
import { posSaleSchema } from '@/lib/validations/ticketing';
import { createPosSale } from '@/lib/ticketing/pos';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const POS_ROLES = ['POS_VENDOR', 'ADMIN'];

// POST /api/pos/sales
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return apiError('Non autorisé', 401);
  if (!POS_ROLES.includes(user.role)) return apiError('Accès refusé', 403);

  const rl = checkRateLimit(getClientIdentifier(request), 'write');
  if (!rl.success) return apiError('Trop de ventes rapprochées. Patientez un instant.', 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }
  const parsed = posSaleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  try {
    const result = await createPosSale(user.id, parsed.data);
    if (!result.ok) {
      const status = result.code === 'INTERNAL' ? 500 : result.code === 'SOLD_OUT' ? 409 : 400;
      return NextResponse.json(
        { success: false, error: result.message, code: result.code },
        { status }
      );
    }
    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: result.orderId,
          reused: result.reused,
          totalAmount: result.totalAmount,
          posCommission: result.posCommission,
          tickets: result.tickets,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    logger.error('POST /api/pos/sales a échoué', err, 'pos.api');
    return apiError('Erreur serveur', 500);
  }
}
