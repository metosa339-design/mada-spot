// POST /api/auth/verify — Vérification du code OTP pour activer le compte
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { verifyOTP } from '@/lib/otp';
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

    const { code } = body;
    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Code invalide. Entrez un code à 6 chiffres.' },
        { status: 400 }
      );
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

    // Verify OTP
    const result = await verifyOTP(session.id, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Code invalide ou expiré.' },
        { status: 400 }
      );
    }

    logger.info(`[AUTH_VERIFICATION_READY] ✓ Compte vérifié pour user ${session.id}`);

    return NextResponse.json({
      success: true,
      message: 'Compte vérifié avec succès ! Bienvenue sur MadaSpot.',
    });
  } catch (error) {
    logger.error('Erreur vérification OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la vérification' },
      { status: 500 }
    );
  }
}
