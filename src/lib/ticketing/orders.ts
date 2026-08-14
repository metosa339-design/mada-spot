// Mada Spot — Billetterie : service de commandes.
//
// Cœur métier partagé par le checkout (Achat Express) et le webhook de paiement.
// Garantit :
//   • la réservation atomique des stocks (fonction SQL reserve_tickets, FOR UPDATE) ;
//   • l'idempotence des commandes (idempotencyKey unique) ;
//   • l'idempotence du règlement (une transaction PAID n'est traitée qu'une fois) ;
//   • la libération des stocks à l'expiration ou en cas d'échec.

import { Prisma, type TicketPaymentMethod } from '@prisma/client';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { computeCommission, getTicketingConfig } from './commission';
import { generateQrHash, generateSecurityCode, newIdempotencyKey } from './codes';
import { deliverTicketNotification } from './notify';
import type { CreateOrderInput } from '@/lib/validations/ticketing';
import { normalizeMalagasyPhone } from '@/lib/validations/ticketing';

export type CreateOrderResult =
  | { ok: true; orderId: string; reused: boolean; expiresAt: Date; totalAmount: string }
  | { ok: false; code: OrderErrorCode; message: string; ticketTypeId?: string };

export type OrderErrorCode =
  | 'EVENT_NOT_FOUND'
  | 'TICKET_TYPE_INVALID'
  | 'SOLD_OUT'
  | 'MAX_PER_ORDER'
  | 'SALES_CLOSED'
  | 'INTERNAL';

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://madaspot.mg'
  ).replace(/\/$/, '');
}

/** Agrège les quantités par type de billet (empêche de contourner maxPerOrder). */
function aggregateItems(items: CreateOrderInput['items']): Map<string, number> {
  const map = new Map<string, number>();
  for (const it of items) {
    map.set(it.ticketTypeId, (map.get(it.ticketTypeId) ?? 0) + it.quantity);
  }
  return map;
}

/**
 * Crée une commande d'achat express. Réserve les stocks de façon atomique puis
 * matérialise les billets (PENDING tant que le paiement n'est pas confirmé).
 *
 * Idempotent : deux appels avec la même idempotencyKey renvoient la même
 * commande sans double réservation ni double débit.
 */
export async function createExpressOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const idempotencyKey = input.idempotencyKey ?? newIdempotencyKey();

  // 1) Court-circuit d'idempotence : commande déjà connue → on la renvoie.
  const existing = await prisma.ticketOrder.findUnique({
    where: { idempotencyKey },
    select: { id: true, expiresAt: true, totalAmount: true },
  });
  if (existing) {
    return {
      ok: true,
      orderId: existing.id,
      reused: true,
      expiresAt: existing.expiresAt,
      totalAmount: existing.totalAmount.toString(),
    };
  }

  const quantities = aggregateItems(input.items);
  const ticketTypeIds = [...quantities.keys()];

  // 2) Charge et valide les types de billets demandés.
  const types = await prisma.ticketType.findMany({
    where: { id: { in: ticketTypeIds }, eventId: input.eventId },
  });
  if (types.length !== ticketTypeIds.length) {
    return { ok: false, code: 'TICKET_TYPE_INVALID', message: 'Type de billet invalide pour cet événement.' };
  }

  const now = new Date();
  let gross = new Prisma.Decimal(0);
  for (const t of types) {
    const qty = quantities.get(t.id)!;
    if (!t.isActive) {
      return { ok: false, code: 'SALES_CLOSED', message: `La vente « ${t.name} » est clôturée.`, ticketTypeId: t.id };
    }
    if (t.salesEnd && t.salesEnd <= now) {
      return { ok: false, code: 'SALES_CLOSED', message: `La vente « ${t.name} » est terminée.`, ticketTypeId: t.id };
    }
    if (qty > t.maxPerOrder) {
      return { ok: false, code: 'MAX_PER_ORDER', message: `Maximum ${t.maxPerOrder} billet(s) « ${t.name} » par commande.`, ticketTypeId: t.id };
    }
    gross = gross.add(new Prisma.Decimal(t.priceMga).mul(qty));
  }

  // 3) Commissions.
  const config = await getTicketingConfig();
  const isPos = input.channelSource === 'POS' || input.paymentMethod === 'CASH_POS';
  const breakdown = computeCommission({ grossAmount: gross, isPos }, config);
  const expiresAt = new Date(now.getTime() + config.reservationTtlMinutes * 60_000);

  const clientId = null; // les commandes express sont anonymes jusqu'à réclamation

  try {
    const order = await prisma.$transaction(
      async (tx) => {
        // 3a) Réservation atomique de chaque stock (verrou FOR UPDATE en base).
        for (const t of types) {
          const qty = quantities.get(t.id)!;
          const rows = await tx.$queryRaw<{ ok: boolean }[]>(
            Prisma.sql`SELECT reserve_tickets(${t.id}::text, ${qty}::int) AS ok`
          );
          if (!rows[0]?.ok) {
            // Stock insuffisant / vente close → rollback des réservations déjà faites.
            throw new ReserveError(t.id, t.name);
          }
        }

        // 3b) Création de la commande (PENDING).
        const created = await tx.ticketOrder.create({
          data: {
            idempotencyKey,
            clientId,
            clientName: input.clientName.trim(),
            clientPhone: normalizeMalagasyPhone(input.clientPhone),
            eventId: input.eventId,
            totalAmount: breakdown.totalAmount,
            platformFee: breakdown.platformFee,
            posFee: breakdown.posFee,
            organizerNet: breakdown.organizerNet,
            paymentMethod: input.paymentMethod,
            channelSource: input.channelSource,
            expiresAt,
          },
          select: { id: true },
        });

        // 3c) Matérialisation des billets (invalides tant que la commande n'est
        //     pas PAID — le scanner ne charge que les billets payés).
        const ticketData: Prisma.EventTicketCreateManyInput[] = [];
        for (const t of types) {
          const qty = quantities.get(t.id)!;
          for (let i = 0; i < qty; i++) {
            ticketData.push({
              orderId: created.id,
              ticketTypeId: t.id,
              ownerId: clientId,
              securityCode: generateSecurityCode(),
              qrHash: generateQrHash(),
            });
          }
        }
        await tx.eventTicket.createMany({ data: ticketData });

        return { id: created.id };
      },
      { timeout: 15_000, maxWait: 10_000 }
    );

    return {
      ok: true,
      orderId: order.id,
      reused: false,
      expiresAt,
      totalAmount: breakdown.totalAmount.toString(),
    };
  } catch (err) {
    if (err instanceof ReserveError) {
      return { ok: false, code: 'SOLD_OUT', message: `Stock insuffisant pour « ${err.typeName} ».`, ticketTypeId: err.ticketTypeId };
    }
    // Course sur l'idempotencyKey (deux requêtes identiques simultanées).
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      const again = await prisma.ticketOrder.findUnique({
        where: { idempotencyKey },
        select: { id: true, expiresAt: true, totalAmount: true },
      });
      if (again) {
        return { ok: true, orderId: again.id, reused: true, expiresAt: again.expiresAt, totalAmount: again.totalAmount.toString() };
      }
    }
    logger.error('createExpressOrder a échoué', err, 'ticketing.orders');
    return { ok: false, code: 'INTERNAL', message: 'Impossible de créer la commande. Réessayez.' };
  }
}

class ReserveError extends Error {
  constructor(public ticketTypeId: string, public typeName: string) {
    super(`reserve failed for ${ticketTypeId}`);
    this.name = 'ReserveError';
  }
}

export interface FulfillArgs {
  transactionRef: string;
  provider?: TicketPaymentMethod;
}

export type FulfillResult =
  | { status: 'PAID'; alreadyProcessed: boolean; orderId: string }
  | { status: 'IGNORED'; reason: string };

/**
 * Marque une commande comme payée, matérialise l'appartenance des billets et
 * déclenche la distribution (WhatsApp → SMS → PWA). Idempotent : si la commande
 * est déjà PAID, ne refait rien et signale `alreadyProcessed`.
 */
export async function fulfillPaidOrder(
  orderId: string,
  args: FulfillArgs
): Promise<FulfillResult> {
  // Transition atomique PENDING/PROCESSING → PAID, protégée contre la
  // concurrence par updateMany conditionnel (garde sur paymentStatus).
  const marked = await prisma.$transaction(async (tx) => {
    const order = await tx.ticketOrder.findUnique({
      where: { id: orderId },
      select: { id: true, paymentStatus: true },
    });
    if (!order) return { kind: 'NOT_FOUND' as const };

    if (order.paymentStatus === 'PAID') {
      return { kind: 'ALREADY' as const };
    }
    if (order.paymentStatus === 'REFUNDED') {
      return { kind: 'REFUNDED' as const };
    }

    const res = await tx.ticketOrder.updateMany({
      where: { id: orderId, paymentStatus: { in: ['PENDING', 'PROCESSING'] } },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        transactionRef: args.transactionRef,
        ...(args.provider ? { paymentMethod: args.provider } : {}),
      },
    });
    if (res.count === 0) {
      // Une autre exécution concurrente a gagné la course.
      return { kind: 'RACE' as const };
    }
    return { kind: 'MARKED' as const };
  });

  if (marked.kind === 'NOT_FOUND') return { status: 'IGNORED', reason: 'order-not-found' };
  if (marked.kind === 'REFUNDED') return { status: 'IGNORED', reason: 'order-refunded' };
  if (marked.kind === 'ALREADY' || marked.kind === 'RACE') {
    return { status: 'PAID', alreadyProcessed: true, orderId };
  }

  // Distribution des billets hors transaction (ne doit jamais bloquer le règlement).
  try {
    const order = await prisma.ticketOrder.findUnique({
      where: { id: orderId },
      include: {
        event: { select: { title: true } },
        tickets: { select: { securityCode: true } },
      },
    });
    if (order) {
      const result = await deliverTicketNotification({
        clientName: order.clientName,
        clientPhone: order.clientPhone,
        eventTitle: order.event.title,
        ticketCount: order.tickets.length,
        securityCodes: order.tickets.map((t) => t.securityCode),
        walletUrl: `${siteUrl()}/mes-billets?order=${order.id}`,
      });
      await prisma.ticketOrder.update({
        where: { id: orderId },
        data: {
          notifyLog: {
            channel: result.delivered,
            attempts: result.attempts,
          } as unknown as Prisma.InputJsonValue,
        },
      });
    }
  } catch (err) {
    // La commande reste PAID : le billet est disponible dans la PWA.
    logger.error('Distribution des billets échouée (commande reste PAID)', err, 'ticketing.orders');
  }

  return { status: 'PAID', alreadyProcessed: false, orderId };
}

/**
 * Passe une commande en échec/expirée et rend les places au stock. Idempotent :
 * ne touche pas une commande déjà payée.
 */
export async function failOrReleaseOrder(
  orderId: string,
  status: 'FAILED' | 'EXPIRED'
): Promise<{ released: boolean }> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.ticketOrder.findUnique({
      where: { id: orderId },
      select: { id: true, paymentStatus: true },
    });
    if (!order) return { released: false };
    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED') {
      return { released: false }; // ne jamais libérer un stock déjà vendu
    }
    if (order.paymentStatus === status) {
      return { released: false }; // déjà traité
    }

    // Regroupe les billets réservés par type pour restituer les quantités.
    const grouped = await tx.eventTicket.groupBy({
      by: ['ticketTypeId'],
      where: { orderId },
      _count: { _all: true },
    });

    for (const g of grouped) {
      await tx.$queryRaw(
        Prisma.sql`SELECT release_tickets(${g.ticketTypeId}::text, ${g._count._all}::int) AS ok`
      );
    }

    await tx.eventTicket.deleteMany({ where: { orderId } });
    await tx.ticketOrder.update({ where: { id: orderId }, data: { paymentStatus: status } });
    return { released: grouped.length > 0 };
  });
}

/**
 * Balaye les commandes expirées (PENDING dont expiresAt est dépassé) et libère
 * leurs stocks. Destiné à un job planifié (route cron).
 */
export async function releaseExpiredOrders(limit = 200): Promise<{ processed: number }> {
  const expired = await prisma.ticketOrder.findMany({
    where: { paymentStatus: 'PENDING', expiresAt: { lt: new Date() } },
    select: { id: true },
    take: limit,
  });

  let processed = 0;
  for (const o of expired) {
    try {
      await failOrReleaseOrder(o.id, 'EXPIRED');
      processed += 1;
    } catch (err) {
      logger.error('Libération d\'une commande expirée échouée', err, 'ticketing.orders');
    }
  }
  return { processed };
}
