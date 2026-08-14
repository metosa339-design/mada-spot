// Mada Spot — Point de vente physique (Cash-to-Digital).
// Un vendeur POS encaisse en espèces et émet immédiatement des billets payés :
// réservation atomique, commande PAID, crédit du portefeuille de caisse et de
// la commission du vendeur, le tout dans une seule transaction.

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { computeCommission, getTicketingConfig } from './commission';
import { generateQrHash, generateUniqueSecurityCodes, newIdempotencyKey } from './codes';
import { deliverTicketNotification } from './notify';
import { normalizeMalagasyPhone } from '@/lib/validations/ticketing';
import type { CreateOrderInput } from '@/lib/validations/ticketing';

export type PosSaleInput = Pick<
  CreateOrderInput,
  'eventId' | 'clientName' | 'clientPhone' | 'items' | 'idempotencyKey'
>;

export type PosSaleResult =
  | {
      ok: true;
      orderId: string;
      reused: boolean;
      totalAmount: string;
      posCommission: string;
      tickets: { securityCode: string; category: string; qrHash: string }[];
    }
  | { ok: false; code: string; message: string; ticketTypeId?: string };

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://madaspot.mg'
  ).replace(/\/$/, '');
}

function aggregate(items: PosSaleInput['items']): Map<string, number> {
  const map = new Map<string, number>();
  for (const it of items) map.set(it.ticketTypeId, (map.get(it.ticketTypeId) ?? 0) + it.quantity);
  return map;
}

/**
 * Enregistre une vente au guichet. Idempotent via idempotencyKey.
 */
export async function createPosSale(
  vendorId: string,
  input: PosSaleInput
): Promise<PosSaleResult> {
  const idempotencyKey = input.idempotencyKey ?? newIdempotencyKey();

  // Idempotence : renvoyer la vente déjà enregistrée sans réémettre.
  const existing = await prisma.ticketOrder.findUnique({
    where: { idempotencyKey },
    select: {
      id: true,
      totalAmount: true,
      posFee: true,
      tickets: { select: { securityCode: true, qrHash: true, ticketType: { select: { name: true } } } },
    },
  });
  if (existing) {
    return {
      ok: true,
      orderId: existing.id,
      reused: true,
      totalAmount: existing.totalAmount.toString(),
      posCommission: existing.posFee.toString(),
      tickets: existing.tickets.map((t) => ({
        securityCode: t.securityCode,
        qrHash: t.qrHash,
        category: t.ticketType.name,
      })),
    };
  }

  const quantities = aggregate(input.items);
  const typeIds = [...quantities.keys()];
  const types = await prisma.ticketType.findMany({
    where: { id: { in: typeIds }, eventId: input.eventId },
  });
  if (types.length !== typeIds.length) {
    return { ok: false, code: 'TICKET_TYPE_INVALID', message: 'Type de billet invalide pour cet événement.' };
  }

  const now = new Date();
  let gross = new Prisma.Decimal(0);
  for (const t of types) {
    const qty = quantities.get(t.id)!;
    if (!t.isActive || (t.salesEnd && t.salesEnd <= now)) {
      return { ok: false, code: 'SALES_CLOSED', message: `La vente « ${t.name} » est clôturée.`, ticketTypeId: t.id };
    }
    if (qty > t.maxPerOrder) {
      return { ok: false, code: 'MAX_PER_ORDER', message: `Maximum ${t.maxPerOrder} billet(s) « ${t.name} ».`, ticketTypeId: t.id };
    }
    gross = gross.add(new Prisma.Decimal(t.priceMga).mul(qty));
  }

  const config = await getTicketingConfig();
  const breakdown = computeCommission({ grossAmount: gross, isPos: true }, config);

  try {
    const created = await prisma.$transaction(
      async (tx) => {
        for (const t of types) {
          const qty = quantities.get(t.id)!;
          const rows = await tx.$queryRaw<{ ok: boolean }[]>(
            Prisma.sql`SELECT reserve_tickets(${t.id}::text, ${qty}::int) AS ok`
          );
          if (!rows[0]?.ok) throw new PosReserveError(t.name);
        }

        const order = await tx.ticketOrder.create({
          data: {
            idempotencyKey,
            clientName: input.clientName.trim(),
            clientPhone: normalizeMalagasyPhone(input.clientPhone),
            eventId: input.eventId,
            totalAmount: breakdown.totalAmount,
            platformFee: breakdown.platformFee,
            posFee: breakdown.posFee,
            organizerNet: breakdown.organizerNet,
            paymentMethod: 'CASH_POS',
            channelSource: 'POS',
            posVendorId: vendorId,
            // Espèces encaissées → payée immédiatement.
            paymentStatus: 'PAID',
            paidAt: now,
            transactionRef: `POS-${idempotencyKey}`,
            expiresAt: now,
          },
          select: { id: true },
        });

        // Codes à 6 chiffres uniques au sein de l'événement.
        const totalQty = [...quantities.values()].reduce((s, n) => s + n, 0);
        const existingCodes = await tx.eventTicket.findMany({
          where: { order: { eventId: input.eventId } },
          select: { securityCode: true },
        });
        const codes = generateUniqueSecurityCodes(
          totalQty,
          new Set(existingCodes.map((c) => c.securityCode))
        );

        const ticketRows: Prisma.EventTicketCreateManyInput[] = [];
        const preview: { securityCode: string; qrHash: string; category: string }[] = [];
        let ci = 0;
        for (const t of types) {
          const qty = quantities.get(t.id)!;
          for (let i = 0; i < qty; i++) {
            const securityCode = codes[ci++];
            const qrHash = generateQrHash();
            ticketRows.push({ orderId: order.id, ticketTypeId: t.id, securityCode, qrHash });
            preview.push({ securityCode, qrHash, category: t.name });
          }
        }
        await tx.eventTicket.createMany({ data: ticketRows });

        // Crédite le portefeuille du vendeur : caisse + commission POS.
        await tx.posWallet.upsert({
          where: { vendorId },
          create: {
            vendorId,
            cashBalance: breakdown.totalAmount,
            totalCommissionsEarned: breakdown.posFee,
          },
          update: {
            cashBalance: { increment: breakdown.totalAmount },
            totalCommissionsEarned: { increment: breakdown.posFee },
            updatedAt: now,
          },
        });

        return { id: order.id, preview };
      },
      { timeout: 15_000, maxWait: 10_000 }
    );

    // Notification hors transaction (ne bloque jamais l'encaissement).
    try {
      const evt = await prisma.event.findUnique({
        where: { id: input.eventId },
        select: { title: true },
      });
      const result = await deliverTicketNotification({
        clientName: input.clientName.trim(),
        clientPhone: normalizeMalagasyPhone(input.clientPhone),
        eventTitle: evt?.title ?? 'Événement',
        ticketCount: created.preview.length,
        securityCodes: created.preview.map((t) => t.securityCode),
        walletUrl: `${siteUrl()}/mes-billets?order=${created.id}`,
      });
      await prisma.ticketOrder.update({
        where: { id: created.id },
        data: { notifyLog: { channel: result.delivered, attempts: result.attempts } as unknown as Prisma.InputJsonValue },
      });
    } catch (err) {
      logger.error('Notification POS échouée (vente encaissée)', err, 'ticketing.pos');
    }

    return {
      ok: true,
      orderId: created.id,
      reused: false,
      totalAmount: breakdown.totalAmount.toString(),
      posCommission: breakdown.posFee.toString(),
      tickets: created.preview,
    };
  } catch (err) {
    if (err instanceof PosReserveError) {
      return { ok: false, code: 'SOLD_OUT', message: `Stock insuffisant pour « ${err.typeName} ».` };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // Course sur l'idempotencyKey : renvoyer la vente existante.
      const again = await prisma.ticketOrder.findUnique({
        where: { idempotencyKey },
        select: {
          id: true,
          totalAmount: true,
          posFee: true,
          tickets: { select: { securityCode: true, qrHash: true, ticketType: { select: { name: true } } } },
        },
      });
      if (again) {
        return {
          ok: true,
          orderId: again.id,
          reused: true,
          totalAmount: again.totalAmount.toString(),
          posCommission: again.posFee.toString(),
          tickets: again.tickets.map((t) => ({ securityCode: t.securityCode, qrHash: t.qrHash, category: t.ticketType.name })),
        };
      }
    }
    logger.error('createPosSale a échoué', err, 'ticketing.pos');
    return { ok: false, code: 'INTERNAL', message: 'Vente impossible. Réessayez.' };
  }
}

class PosReserveError extends Error {
  constructor(public typeName: string) {
    super('pos reserve failed');
  }
}
