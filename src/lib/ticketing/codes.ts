// Mada Spot — Billetterie
// Génération des identifiants de billets : code de secours à 6 chiffres,
// empreinte QR unique et non falsifiable, clé d'idempotence.

import crypto from 'crypto';
import { serverEnv } from '@/lib/env';

/** Secret de signature des manifestes de billets (fallback sur NEXTAUTH_SECRET). */
function qrSecret(): string {
  return (
    serverEnv.TICKET_QR_SECRET ||
    serverEnv.NEXTAUTH_SECRET ||
    serverEnv.EMAIL_SECRET ||
    'mada-spot-dev-qr-secret'
  );
}

/**
 * Code de secours à 6 chiffres, saisi manuellement au contrôle si le téléphone
 * du client est hors service. Tirage cryptographiquement sûr et uniforme.
 */
export function generateSecurityCode(): string {
  // 0 … 999999, sans biais de modulo (rejection sampling léger).
  let n: number;
  do {
    n = crypto.randomBytes(4).readUInt32BE(0);
  } while (n >= 4_294_000_000); // borne multiple de 1_000_000 la plus proche
  return String(n % 1_000_000).padStart(6, '0');
}

/**
 * Génère `count` codes à 6 chiffres UNIQUES au sein d'un événement (aucun ne
 * figure dans `taken`, ni en doublon dans le lot). Évite qu'un contrôle manuel
 * par code valide le mauvais billet. L'espace (10^6) est très supérieur au
 * nombre de billets d'un événement, donc la génération converge immédiatement.
 */
export function generateUniqueSecurityCodes(count: number, taken: Set<string>): string[] {
  const out: string[] = [];
  const seen = new Set(taken);
  while (out.length < count) {
    const code = generateSecurityCode();
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

/**
 * Empreinte QR unique et imprévisible (192 bits d'entropie). Encodée en
 * base64url et préfixée pour être reconnaissable. L'unicité est garantie par
 * l'index unique en base ; la valeur est stockée telle quelle dans le QR Code.
 */
export function generateQrHash(): string {
  const token = crypto.randomBytes(24).toString('base64url');
  return `MST-${token}`;
}

/**
 * Signe un manifeste d'événement (liste des billets) pour que l'app scanner
 * puisse vérifier hors-ligne que les données proviennent bien de la plateforme
 * et n'ont pas été altérées sur l'appareil.
 */
export function signManifest(payload: string): string {
  return crypto.createHmac('sha256', qrSecret()).update(payload).digest('base64url');
}

/** Vérifie une signature de manifeste en temps constant. */
export function verifyManifestSignature(payload: string, signature: string): boolean {
  const expected = signManifest(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Clé d'idempotence pour une commande (anti double-débit). */
export function newIdempotencyKey(): string {
  return `ord_${crypto.randomBytes(18).toString('base64url')}`;
}
