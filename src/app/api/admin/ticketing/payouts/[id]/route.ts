// Mada Spot — Admin billetterie : traitement d'une demande de virement.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { requireAdminSession, ensureCsrf } from '@/lib/ticketing/admin';
import type { PayoutStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  csrfToken: z.string().optional(),
  action: z.enum(['APPROVE', 'EXECUTE', 'REJECT']),
});

// Transitions autorisées de statut de payout.
const TRANSITIONS: Record<string, { from: PayoutStatus[]; to: PayoutStatus }> = {
  APPROVE: { from: ['PENDING'], to: 'APPROVED' },
  EXECUTE: { from: ['PENDING', 'APPROVED'], to: 'EXECUTED' },
  REJECT: { from: ['PENDING', 'APPROVED'], to: 'REJECTED' },
};

// POST /api/admin/ticketing/payouts/[id]
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

  const rule = TRANSITIONS[parsed.data.action];

  try {
    const payout = await prisma.payoutRequest.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!payout) return apiError('Demande introuvable', 404);
    if (!rule.from.includes(payout.status)) {
      return NextResponse.json(
        { success: false, error: `Transition impossible depuis le statut ${payout.status}.` },
        { status: 409 }
      );
    }

    const terminal = rule.to === 'EXECUTED' || rule.to === 'REJECTED';
    await prisma.payoutRequest.update({
      where: { id },
      data: { status: rule.to, ...(terminal ? { processedAt: new Date() } : {}) },
    });

    await logAudit({
      userId: auth.admin.id,
      action: `TICKETING_PAYOUT_${parsed.data.action}`,
      entityType: 'PayoutRequest',
      entityId: id,
      details: { from: payout.status, to: rule.to },
      ...getRequestMeta(request),
    });

    return NextResponse.json({ success: true, data: { status: rule.to } });
  } catch (err) {
    logger.error('POST admin/ticketing/payouts/[id] a échoué', err, 'admin.ticketing');
    return apiError('Erreur serveur', 500);
  }
}
