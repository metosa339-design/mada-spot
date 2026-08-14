// Mada Spot — Billetterie : vérification de signature des webhooks Mobile Money.

import crypto from 'crypto';
import { serverEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Vérifie la signature HMAC-SHA256 d'un webhook Mobile Money.
 * En-tête attendu : `x-madaspot-signature: sha256=<hex>` calculé sur le corps brut.
 *
 * Si aucun secret n'est configuré, la vérification est ignorée en développement
 * mais refusée en production (fail-closed).
 */
export function verifyMobileMoneySignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = serverEnv.MOBILE_MONEY_WEBHOOK_SECRET;

  if (!secret) {
    logger.warn('MOBILE_MONEY_WEBHOOK_SECRET absent — vérification de signature ignorée');
    return serverEnv.NODE_ENV !== 'production';
  }
  if (!signatureHeader) return false;

  const [algo, signature] = signatureHeader.split('=');
  if (algo !== 'sha256' || !signature) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  try {
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expected, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
