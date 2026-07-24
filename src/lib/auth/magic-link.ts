import crypto from 'crypto';

/**
 * Lien de connexion magique — token signé, SANS stockage en base.
 *
 * Format : base64url(payload) + '.' + base64url(HMAC-SHA256(payload))
 * payload = `${userId}.${expMs}`
 *
 * Le token s'auto-vérifie (signature + expiration). Pas de table, pas de
 * migration. Compromis assumé : le lien n'est pas à usage unique (réutilisable
 * jusqu'à expiration). C'est acceptable ici — il connecte l'utilisateur à SON
 * propre compte pour compléter sa fiche (ce n'est pas une réinitialisation de
 * mot de passe). Expiration courte + HTTPS limitent le risque.
 */

const SECRET = process.env.NEXTAUTH_SECRET || process.env.EMAIL_SECRET || '';
const DEFAULT_TTL_MS = 48 * 60 * 60 * 1000; // 48 h

export function signMagicToken(userId: string, ttlMs: number = DEFAULT_TTL_MS): string | null {
  if (!SECRET || !userId) return null;
  const payload = `${userId}.${Date.now() + ttlMs}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${Buffer.from(payload).toString('base64url')}.${sig}`;
}

export function verifyMagicToken(token: string): { userId: string } | null {
  if (!SECRET || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const dot = payload.lastIndexOf('.');
  if (dot < 0) return null;
  const userId = payload.slice(0, dot);
  const exp = Number(payload.slice(dot + 1));
  if (!userId || !Number.isFinite(exp) || Date.now() > exp) return null;

  return { userId };
}
