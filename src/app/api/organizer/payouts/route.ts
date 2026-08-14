// Mada Spot — Organisateur : trésorerie & demandes de virement (payouts).

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireOrganizer, getOrganizerBalance } from '@/lib/ticketing/organizer';
import { createPayoutSchema, normalizeMalagasyPhone } from '@/lib/validations/ticketing';

export const dynamic = 'force-dynamic';

// GET /api/organizer/payouts — solde + historique.
export async function GET(request: NextRequest) {
  const auth = await requireOrganizer(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.id;

  try {
    const [balance, requests] = await Promise.all([
      getOrganizerBalance(userId),
      prisma.payoutRequest.findMany({
        where: { organizerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          amount: true,
          status: true,
          mobileMoneyNumber: true,
          provider: true,
          processedAt: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        balance,
        requests: requests.map((r) => ({
          id: r.id,
          amount: r.amount.toString(),
          status: r.status,
          mobileMoneyNumber: r.mobileMoneyNumber,
          provider: r.provider,
          processedAt: r.processedAt,
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (err) {
    logger.error('GET /api/organizer/payouts a échoué', err, 'organizer.api');
    return apiError('Erreur serveur', 500);
  }
}

// POST /api/organizer/payouts — nouvelle demande de virement.
export async function POST(request: NextRequest) {
  const auth = await requireOrganizer(request);
  if (auth instanceof NextResponse) return auth;
  const userId = auth.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('JSON invalide', 400);
  }
  const parsed = createPayoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const input = parsed.data;
  const amount = new Prisma.Decimal(input.amount);

  try {
    // Revalidation serveur de la trésorerie (le client ne fait pas foi).
    const balance = await getOrganizerBalance(userId);
    const available = new Prisma.Decimal(balance.available);
    const minPayout = new Prisma.Decimal(balance.minPayout);

    if (amount.lt(minPayout)) {
      return NextResponse.json(
        { success: false, error: `Montant minimum de retrait : ${minPayout.toString()} Ar.` },
        { status: 422 }
      );
    }
    if (amount.gt(available)) {
      return NextResponse.json(
        { success: false, error: `Solde insuffisant. Disponible : ${available.toString()} Ar.` },
        { status: 409 }
      );
    }

    const created = await prisma.payoutRequest.create({
      data: {
        organizerId: userId,
        amount,
        provider: input.provider,
        mobileMoneyNumber: normalizeMalagasyPhone(input.mobileMoneyNumber),
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 });
  } catch (err) {
    logger.error('POST /api/organizer/payouts a échoué', err, 'organizer.api');
    return apiError('Erreur serveur', 500);
  }
}
