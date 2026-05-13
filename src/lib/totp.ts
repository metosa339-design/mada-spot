// TOTP RFC 6238 — minimal implementation using Node crypto (no external deps).
// Used for admin 2FA.
import crypto from 'crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateSecret(bytes = 20): string {
  // 20 bytes = 160 bits, recommended for SHA1 HMAC
  return toBase32(crypto.randomBytes(bytes));
}

export function toBase32(buf: Buffer): string {
  let out = '';
  let bits = 0;
  let value = 0;
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

export function fromBase32(s: string): Buffer {
  const clean = s.replace(/=+$/, '').replace(/\s/g, '').toUpperCase();
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const c of clean) {
    const i = ALPHABET.indexOf(c);
    if (i === -1) throw new Error('Invalid base32 character');
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function hotp(secret: Buffer, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

export function generateTotp(secret: string, when: Date = new Date()): string {
  const counter = Math.floor(when.getTime() / 1000 / 30);
  return hotp(fromBase32(secret), counter);
}

/**
 * Verifies a 6-digit TOTP code. Accepts a window of ±1 (so 30s clock drift OK).
 * Use constant-time comparison on the candidate codes to mitigate timing attacks.
 */
export function verifyTotp(secret: string, code: string, when: Date = new Date()): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const buf = fromBase32(secret);
  const t = Math.floor(when.getTime() / 1000 / 30);
  const candidates = [hotp(buf, t - 1), hotp(buf, t), hotp(buf, t + 1)];
  return candidates.some((c) => crypto.timingSafeEqual(Buffer.from(c), Buffer.from(code)));
}

export function otpauthUrl(secret: string, accountName: string, issuer: string): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params.toString()}`;
}
