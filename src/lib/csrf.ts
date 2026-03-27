import crypto from 'crypto';

// Lazy-evaluated secret to avoid crashing at import time
let _csrfSecret: string | null = null;

function getCsrfSecret(): string {
  if (_csrfSecret) return _csrfSecret;

  const secret = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // In production, CSRF_SECRET is required
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CSRF_SECRET or NEXTAUTH_SECRET environment variable is required in production');
    }
    // Use a stable deterministic secret in dev to avoid worker mismatch with Turbopack
    _csrfSecret = 'mada-spot-dev-csrf-secret-do-not-use-in-production';
    return _csrfSecret;
  }

  _csrfSecret = secret;
  return _csrfSecret;
}

const TOKEN_EXPIRY = 4 * 60 * 60 * 1000; // 4 heures

/**
 * Génère un token CSRF signé avec un timestamp
 */
export function generateCsrfToken(): string {
  const secret = getCsrfSecret();
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}.${random}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .substring(0, 16);
  return `${payload}.${signature}`;
}

/**
 * Vérifie la validité d'un token CSRF
 */
export function verifyCsrfToken(token: string): boolean {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const secret = getCsrfSecret();
  const [timestamp, random, signature] = parts;
  const payload = `${timestamp}.${random}`;

  // Vérifier signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .substring(0, 16);

  if (signature !== expectedSignature) return false;

  // Vérifier expiration
  const tokenTime = parseInt(timestamp, 36);
  if (Date.now() - tokenTime > TOKEN_EXPIRY) return false;

  return true;
}
