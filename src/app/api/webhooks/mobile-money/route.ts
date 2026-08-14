// Mada Spot — Webhook de paiement Mobile Money (MVola / Orange Money / Airtel).
//
// Contraintes de robustesse (spec §3.C) :
//   1. Idempotence stricte : un même transactionRef déjà traité renvoie 200
//      immédiatement, sans dédoubler la réservation, le débit ou l'envoi.
//   2. Circuit breaker & fallback : la distribution des billets bascule
//      WhatsApp → SMS → PWA (géré dans deliverTicketNotification). La commande
//      reste PAID même si tous les canaux message échouent.
//
// Sécurité : signature HMAC sur le corps brut (fail-closed en production).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { mobileMoneyWebhookSchema } from '@/lib/validations/ticketing';
import { verifyMobileMoneySignature } from '@/lib/ticketing/webhook-security';
import { failOrReleaseOrder, fulfillPaidOrder } from '@/lib/ticketing/orders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const SIGNATURE_HEADERS = ['x-madaspot-signature', 'x-signature', 'x-callback-signature'];

function getSignature(request: NextRequest): string | null {
  for (const h of SIGNATURE_HEADERS) {
    const v = request.headers.get(h);
    if (v) return v;
  }
  return null;
}

export async function POST(request: NextRequest) {
  // 1) Corps brut requis AVANT parsing (signature calculée dessus).
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ success: false, error: 'Corps illisible' }, { status: 400 });
  }

  // 2) Vérification de signature (fail-closed en production).
  if (!verifyMobileMoneySignature(rawBody, getSignature(request))) {
    logger.warn('Webhook Mobile Money : signature invalide', 'webhook.mobile-money');
    return NextResponse.json({ success: false, error: 'Signature invalide' }, { status: 401 });
  }

  // 3) Parsing + validation.
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = mobileMoneyWebhookSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Payload invalide', details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const evt = parsed.data;

  try {
    // 4) IDEMPOTENCE FORTE : ce transactionRef a-t-il déjà été rapproché ?
    const already = await prisma.ticketOrder.findUnique({
      where: { transactionRef: evt.transactionRef },
      select: { id: true, paymentStatus: true },
    });
    if (already) {
      // Déjà traité (payé, échoué ou remboursé) → on acquitte sans rien refaire.
      return NextResponse.json(
        { success: true, data: { orderId: already.id, status: already.paymentStatus, idempotent: true } },
        { status: 200 }
      );
    }

    // 5) Résolution de la commande cible.
    const order = await resolveOrder(evt.orderId, evt.idempotencyKey);
    if (!order) {
      // Commande introuvable : 404 → l'opérateur pourra réessayer (course possible
      // entre le callback et la persistance de la commande).
      logger.warn('Webhook Mobile Money : commande introuvable', 'webhook.mobile-money', {
        orderId: evt.orderId,
        idempotencyKey: evt.idempotencyKey,
      });
      return NextResponse.json({ success: false, error: 'Commande introuvable' }, { status: 404 });
    }

    // 6) Traitement selon le statut opérateur.
    if (evt.status === 'SUCCESS') {
      const result = await fulfillPaidOrder(order.id, {
        transactionRef: evt.transactionRef,
        provider: evt.provider,
      });
      if (result.status === 'IGNORED') {
        return NextResponse.json({ success: true, data: { orderId: order.id, ignored: result.reason } }, { status: 200 });
      }
      if (result.status === 'NEEDS_REFUND') {
        // Paiement encaissé mais commande non honorable (expirée/échouée). On
        // acquitte (200, pas de ret's) et on signale le remboursement à faire.
        logger.error('Webhook : paiement tardif à rembourser', undefined, 'webhook.mobile-money', {
          orderId: order.id,
          transactionRef: evt.transactionRef,
        });
        return NextResponse.json(
          { success: true, data: { orderId: order.id, status: 'NEEDS_REFUND', reason: result.reason } },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { success: true, data: { orderId: order.id, status: 'PAID', alreadyProcessed: result.alreadyProcessed } },
        { status: 200 }
      );
    }

    if (evt.status === 'FAILED' || evt.status === 'CANCELLED') {
      await failOrReleaseOrder(order.id, 'FAILED');
      return NextResponse.json({ success: true, data: { orderId: order.id, status: 'FAILED' } }, { status: 200 });
    }

    // PENDING : on marque PROCESSING (sans toucher au stock déjà réservé).
    await prisma.ticketOrder.updateMany({
      where: { id: order.id, paymentStatus: 'PENDING' },
      data: { paymentStatus: 'PROCESSING' },
    });
    return NextResponse.json({ success: true, data: { orderId: order.id, status: 'PROCESSING' } }, { status: 200 });
  } catch (err) {
    logger.error('Webhook Mobile Money : erreur de traitement', err, 'webhook.mobile-money');
    // 500 → l'opérateur réessaiera ; l'idempotence garantit l'absence de doublon.
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

async function resolveOrder(
  orderId?: string,
  idempotencyKey?: string
): Promise<{ id: string } | null> {
  if (orderId) {
    const byId = await prisma.ticketOrder.findUnique({ where: { id: orderId }, select: { id: true } });
    if (byId) return byId;
  }
  if (idempotencyKey) {
    const byKey = await prisma.ticketOrder.findUnique({
      where: { idempotencyKey },
      select: { id: true },
    });
    if (byKey) return byKey;
  }
  return null;
}
