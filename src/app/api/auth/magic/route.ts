import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicToken } from '@/lib/auth/magic-link';
import { createSession, getSessionCookieConfig } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/auth/magic?token=…&redirect=/dashboard&email=…
// Connecte l'utilisateur en un clic depuis le lien reçu par e-mail.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || '';
  const email = url.searchParams.get('email') || '';
  const rawRedirect = url.searchParams.get('redirect');
  // N'accepter qu'un chemin interne (anti open-redirect).
  const redirectTo =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/dashboard';

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://madaspot.com';

  // Repli : lien invalide/expiré → page de connexion avec e-mail pré-rempli.
  const fallback = () => {
    const qs = new URLSearchParams();
    if (email) qs.set('email', email);
    qs.set('redirect', redirectTo);
    qs.set('expired', '1');
    return NextResponse.redirect(`${base}/login?${qs.toString()}`);
  };

  const payload = verifyMagicToken(token);
  if (!payload) return fallback();

  try {
    const sessionToken = await createSession(
      payload.userId,
      request.headers.get('user-agent') || undefined,
    );
    const res = NextResponse.redirect(`${base}${redirectTo}`);
    res.cookies.set(getSessionCookieConfig(sessionToken));
    return res;
  } catch (e) {
    logger.error('[MAGIC] Échec création de session:', e as Error);
    return fallback();
  }
}
