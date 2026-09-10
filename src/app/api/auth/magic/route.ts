import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicToken } from '@/lib/auth/magic-link';
import { createSession, getSessionCookieConfig, updateLastLogin } from '@/lib/auth';
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

    // Une entrée par lien magique est une connexion : on l'horodate comme telle.
    // C'était l'angle mort de la mesure — la table Session étant purgée à chaque
    // connexion, ces entrées ne laissaient aucune trace durable.
    // Hors chemin critique : un échec ne doit pas renvoyer l'utilisateur au
    // formulaire de connexion alors que sa session vient d'être créée.
    void updateLastLogin(payload.userId).catch((e) =>
      logger.error('[MAGIC] Horodatage de connexion échoué:', e as Error)
    );

    const res = NextResponse.redirect(`${base}${redirectTo}`);
    res.cookies.set(getSessionCookieConfig(sessionToken));
    return res;
  } catch (e) {
    logger.error('[MAGIC] Échec création de session:', e as Error);
    return fallback();
  }
}
