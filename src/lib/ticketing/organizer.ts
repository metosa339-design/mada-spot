// Mada Spot — Back-office organisateur : autorisation, propriété et trésorerie.

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getAuthUser, type SessionUser } from '@/lib/auth';
import { getTicketingConfig } from './commission';

const ORGANIZER_ROLES = ['ADMIN', 'ORGANIZER'] as const;

/**
 * Exige un utilisateur organisateur (ORGANIZER) ou administrateur. Retourne
 * l'utilisateur ou une réponse 401/403 prête à renvoyer.
 */
export async function requireOrganizer(
  request: NextRequest
): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }
  if (!ORGANIZER_ROLES.includes(user.role as (typeof ORGANIZER_ROLES)[number])) {
    return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
  }
  return { user };
}

/**
 * Vérifie qu'un utilisateur peut gérer un événement. L'administrateur gère
 * tout ; l'organisateur uniquement les événements qu'il a soumis.
 */
export async function canManageEvent(user: SessionUser, eventId: string): Promise<boolean> {
  if (user.role === 'ADMIN') {
    const exists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    return Boolean(exists);
  }
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { submittedByUserId: true },
  });
  return Boolean(ev && ev.submittedByUserId === user.id);
}

/** Filtre Prisma des événements « possédés » par l'utilisateur (trésorerie). */
export function ownedEventsWhere(userId: string): Prisma.EventWhereInput {
  return { submittedByUserId: userId };
}

export interface OrganizerBalance {
  organizerNet: string; // net cumulé sur commandes payées
  paidOut: string; // déjà demandé/versé (hors rejets)
  available: string; // net − paidOut
  minPayout: string;
}

/**
 * Calcule la trésorerie de l'organisateur : net cumulé des commandes payées de
 * SES événements, moins les payouts non rejetés (PENDING/APPROVED/EXECUTED).
 */
export async function getOrganizerBalance(userId: string): Promise<OrganizerBalance> {
  const [netAgg, payoutAgg, config] = await Promise.all([
    prisma.ticketOrder.aggregate({
      where: { paymentStatus: 'PAID', event: { submittedByUserId: userId } },
      _sum: { organizerNet: true },
    }),
    prisma.payoutRequest.aggregate({
      where: { organizerId: userId, status: { in: ['PENDING', 'APPROVED', 'EXECUTED'] } },
      _sum: { amount: true },
    }),
    getTicketingConfig(),
  ]);

  const net = new Prisma.Decimal(netAgg._sum.organizerNet ?? 0);
  const paidOut = new Prisma.Decimal(payoutAgg._sum.amount ?? 0);
  const available = Prisma.Decimal.max(new Prisma.Decimal(0), net.sub(paidOut));

  return {
    organizerNet: net.toString(),
    paidOut: paidOut.toString(),
    available: available.toString(),
    minPayout: config.minPayoutAmount.toString(),
  };
}
