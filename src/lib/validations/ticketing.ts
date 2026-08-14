// Mada Spot — Billetterie : schémas de validation Zod partagés (client + serveur).

import { z } from 'zod';

/**
 * Numéro mobile malgache. Accepte les formats 03X XXXXXXX, 261 3X…, +261 3X…
 * avec séparateurs optionnels (espaces, tirets, points). Normalisé ensuite en
 * +2613XXXXXXXX par `normalizeMalagasyPhone`.
 */
export const malagasyPhoneSchema = z
  .string()
  .trim()
  .min(1, 'Numéro requis')
  .refine((v) => {
    const digits = v.replace(/[^\d+]/g, '');
    return /^(?:\+?261|0)3[234]\d{7}$/.test(digits);
  }, 'Numéro Mobile Money invalide (ex : 034 12 345 67)');

/** Normalise un numéro malgache valide vers le format international +2613XXXXXXXX. */
export function normalizeMalagasyPhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  const local = digits
    .replace(/^\+?261/, '0') // 261… -> 0…
    .replace(/^0/, ''); // retire le 0 de tête
  return `+261${local}`;
}

export const paymentMethodSchema = z.enum([
  'MVOLA',
  'ORANGE_MONEY',
  'AIRTEL_MONEY',
  'CASH_POS',
  'CARD',
]);

export const channelSourceSchema = z.enum(['WEB', 'WHATSAPP', 'POS']).default('WEB');

export const orderItemSchema = z.object({
  ticketTypeId: z.string().min(1, 'Type de billet requis'),
  quantity: z.number().int().min(1, 'Au moins 1 billet').max(50, 'Trop de billets'),
});

/** Payload d'un achat express (checkout). */
export const createOrderSchema = z.object({
  eventId: z.string().min(1, 'Événement requis'),
  clientName: z
    .string()
    .trim()
    .min(2, 'Nom trop court')
    .max(120, 'Nom trop long'),
  clientPhone: malagasyPhoneSchema,
  paymentMethod: paymentMethodSchema,
  channelSource: channelSourceSchema,
  items: z.array(orderItemSchema).min(1, 'Sélectionnez au moins un billet').max(20),
  /** Clé d'idempotence fournie par le client (sinon générée côté serveur). */
  idempotencyKey: z.string().min(8).max(128).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;

/**
 * Schéma d'un événement webhook Mobile Money. Volontairement permissif sur les
 * champs annexes (chaque opérateur envoie un format légèrement différent), mais
 * strict sur les champs pivots utilisés pour l'idempotence et le rapprochement.
 */
export const mobileMoneyWebhookSchema = z.object({
  /** Référence unique de transaction côté opérateur (idempotence forte). */
  transactionRef: z.string().min(1, 'transactionRef requis'),
  /** Clé d'idempotence de la commande d'origine (idempotence de bout en bout). */
  idempotencyKey: z.string().min(1).optional(),
  /** Identifiant de la commande MadaSpot, si l'opérateur le renvoie. */
  orderId: z.string().min(1).optional(),
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING', 'CANCELLED']),
  amount: z.number().nonnegative().optional(),
  provider: paymentMethodSchema.optional(),
  payerPhone: z.string().optional(),
  rawPayload: z.record(z.string(), z.unknown()).optional(),
});

export type MobileMoneyWebhookInput = z.infer<typeof mobileMoneyWebhookSchema>;

/** Recherche manuelle d'un billet par code à 6 chiffres (secours au scan). */
export const manualCodeSchema = z.object({
  eventId: z.string().min(1),
  securityCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Code à 6 chiffres'),
});

// --- Back-office organisateur ----------------------------------------------

/** Création d'un type de billet. */
export const createTicketTypeSchema = z.object({
  name: z.string().trim().min(2, 'Nom trop court').max(80, 'Nom trop long'),
  priceMga: z.number().int('Prix entier en Ariary').min(0, 'Prix invalide').max(100_000_000),
  totalQuantity: z.number().int().min(1, 'Au moins 1 place').max(1_000_000),
  maxPerOrder: z.number().int().min(1).max(100).default(10),
  salesEnd: z.string().datetime().optional().nullable(),
});
export type CreateTicketTypeInput = z.infer<typeof createTicketTypeSchema>;

/** Mise à jour d'un type de billet (tous champs optionnels). */
export const updateTicketTypeSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    priceMga: z.number().int().min(0).max(100_000_000).optional(),
    /** Nouvelle quantité totale : jamais en dessous du nombre déjà vendu. */
    totalQuantity: z.number().int().min(0).max(1_000_000).optional(),
    maxPerOrder: z.number().int().min(1).max(100).optional(),
    salesEnd: z.string().datetime().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Aucune modification fournie');
export type UpdateTicketTypeInput = z.infer<typeof updateTicketTypeSchema>;

/** Demande de virement (payout) d'un organisateur. */
export const createPayoutSchema = z.object({
  amount: z.number().int().min(1, 'Montant invalide').max(1_000_000_000),
  provider: z.enum(['MVOLA', 'ORANGE_MONEY', 'AIRTEL_MONEY']),
  mobileMoneyNumber: malagasyPhoneSchema,
});
export type CreatePayoutInput = z.infer<typeof createPayoutSchema>;
