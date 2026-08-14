// Mada Spot — Billetterie
// Calcul des commissions plateforme / POS et de la part nette organisateur.
//
// Toute l'arithmétique financière utilise Prisma.Decimal pour éviter les
// erreurs de virgule flottante. Les montants sont en Ariary (MGA), arrondis à
// l'unité (l'Ariary n'a pas de sous-unité en usage courant).

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export interface CommissionInput {
  /** Montant brut de la commande (somme prix × quantités), en MGA. */
  grossAmount: Prisma.Decimal | number | string;
  /** Vrai si la vente passe par un point de vente physique (POS). */
  isPos?: boolean;
}

export interface CommissionBreakdown {
  totalAmount: Prisma.Decimal;
  platformFee: Prisma.Decimal;
  posFee: Prisma.Decimal;
  organizerNet: Prisma.Decimal;
  platformCommissionPercent: Prisma.Decimal;
  posCommissionPercent: Prisma.Decimal;
}

/** Valeurs par défaut si la table de configuration est vide/injoignable. */
export const DEFAULT_TICKETING_CONFIG = {
  platformCommissionPercent: new Prisma.Decimal('5.00'),
  posCommissionPercent: new Prisma.Decimal('2.00'),
  minPayoutAmount: new Prisma.Decimal('50000'),
  reservationTtlMinutes: 15,
};

export interface ResolvedTicketingConfig {
  platformCommissionPercent: Prisma.Decimal;
  posCommissionPercent: Prisma.Decimal;
  minPayoutAmount: Prisma.Decimal;
  reservationTtlMinutes: number;
}

/**
 * Récupère la configuration de commissions (ligne unique id = 1). Retombe sur
 * les valeurs par défaut si la ligne n'existe pas encore, de sorte que le calcul
 * ne lève jamais d'exception pour une base fraîchement migrée.
 */
export async function getTicketingConfig(): Promise<ResolvedTicketingConfig> {
  const row = await prisma.ticketingConfig.findUnique({ where: { id: 1 } });
  if (!row) return { ...DEFAULT_TICKETING_CONFIG };
  return {
    platformCommissionPercent: new Prisma.Decimal(row.platformCommissionPercent),
    posCommissionPercent: new Prisma.Decimal(row.posCommissionPercent),
    minPayoutAmount: new Prisma.Decimal(row.minPayoutAmount),
    reservationTtlMinutes: row.reservationTtlMinutes,
  };
}

/** Arrondit un Decimal à l'unité (MGA), au plus proche, demi vers le haut. */
function roundMga(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
}

/**
 * Calcule la répartition d'une commande à partir d'une configuration déjà
 * résolue. Version pure (sans I/O) pour rester testable et déterministe.
 *
 * Règle : organizerNet = total − platformFee − posFee. La part organisateur
 * absorbe l'arrondi pour que la somme des trois parts égale toujours le brut.
 */
export function computeCommission(
  input: CommissionInput,
  config: Pick<ResolvedTicketingConfig, 'platformCommissionPercent' | 'posCommissionPercent'>
): CommissionBreakdown {
  const total = roundMga(new Prisma.Decimal(input.grossAmount));

  const platformFee = roundMga(
    total.mul(config.platformCommissionPercent).div(100)
  );

  const posFee = input.isPos
    ? roundMga(total.mul(config.posCommissionPercent).div(100))
    : new Prisma.Decimal(0);

  const organizerNet = total.sub(platformFee).sub(posFee);

  return {
    totalAmount: total,
    platformFee,
    posFee,
    organizerNet,
    platformCommissionPercent: config.platformCommissionPercent,
    posCommissionPercent: config.posCommissionPercent,
  };
}

/**
 * Variante avec chargement de la configuration depuis la base.
 */
export async function calculateCommission(
  input: CommissionInput
): Promise<CommissionBreakdown> {
  const config = await getTicketingConfig();
  return computeCommission(input, config);
}
