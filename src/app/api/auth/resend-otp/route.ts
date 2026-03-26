// POST /api/auth/resend-otp — Renvoyer le code OTP de vérification
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { sendOTPToUser } from '@/lib/otp';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(request);
    const rl = checkRateLimit(clientId, 'auth');
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Trop de tentatives. Réessayez plus tard.', retryAfter: rl.resetIn },
        { status: 429, headers: getRateLimitHeaders(rl) }
      );
    }

    const body = await request.json().catch(() => null);
    if (body === null) {
      return NextResponse.json({ success: false, error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    // CSRF verification
    if (!body.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return NextResponse.json({ success: false, error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    // Get user from session
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session invalide ou expirée' }, { status: 401 });
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { email: true, firstName: true, isVerified: true },
    });

    if (!user || !user.email) {
      return NextResponse.json(
        { success: false, error: 'Pas d\'email associé au compte' },
        { status: 400 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json({ success: true, message: 'Compte déjà vérifié' });
    }

    // Send new OTP
    const result = await sendOTPToUser(session.id, user.email, user.firstName || undefined);

    if (!result.success) {
      console.error('[RESEND_OTP] ❌ Échec:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Impossible d\'envoyer le code' },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Nouveau code envoyé par email',
    });
  } catch (error) {
    logger.error('Erreur resend OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
