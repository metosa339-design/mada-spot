// POST /api/auth/verify — Verify OTP and create real account
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createSession, getSessionCookieConfig } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
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

    // Get pending token from cookie
    const pendingToken = request.cookies.get('mada-spot-pending')?.value;

    // Also try session cookie for backward compatibility
    const sessionToken = request.cookies.get('mada-spot-session')?.value;

    if (pendingToken) {
      // NEW FLOW: Pending registration
      const pending = await prisma.pendingRegistration.findUnique({ where: { token: pendingToken } });

      if (!pending) {
        return NextResponse.json({ success: false, error: 'Inscription expirée. Veuillez recommencer.' }, { status: 401 });
      }

      if (pending.expiresAt < new Date()) {
        await prisma.pendingRegistration.delete({ where: { id: pending.id } });
        return NextResponse.json({ success: false, error: 'Inscription expirée. Veuillez recommencer.' }, { status: 401 });
      }

      if (pending.otpExpiresAt < new Date()) {
        return NextResponse.json({ success: false, error: 'Code expiré. Cliquez sur "Renvoyer le code".' }, { status: 400 });
      }

      if (pending.otpCode !== code) {
        return NextResponse.json({ success: false, error: 'Code incorrect.' }, { status: 400 });
      }

      // OTP is correct! Create the real user now
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: pending.email,
            phone: pending.phone,
            password: pending.password,
            firstName: pending.firstName,
            lastName: pending.lastName,
            role: pending.role,
            userType: pending.userType,
            emailVerified: true,
            isVerified: true,
          },
        });

        if (pending.role === 'CLIENT') {
          await tx.clientProfile.create({ data: { userId: newUser.id } });
        }

        // Delete pending registration
        await tx.pendingRegistration.delete({ where: { id: pending.id } });

        return newUser;
      });

      // Create real session
      const deviceInfo = request.headers.get('user-agent') || undefined;
      const ipAddress = request.headers.get('x-forwarded-for') || undefined;
      const newSessionToken = await createSession(user.id, deviceInfo, ipAddress);

      logger.info(`[VERIFY] ✓ Account created and verified for ${user.email}`);

      const response = NextResponse.json({
        success: true,
        message: 'Compte créé et vérifié avec succès ! Bienvenue sur MadaSpot.',
      });

      // Set real session cookie and clear pending cookie
      const cookieConfig = getSessionCookieConfig(newSessionToken);
      response.cookies.set(cookieConfig);
      response.cookies.set({
        name: 'mada-spot-pending',
        value: '',
        maxAge: 0,
        path: '/',
      });

      return response;
    }

    // BACKWARD COMPATIBILITY: Old flow with session cookie
    if (sessionToken) {
      const { verifySession } = await import('@/lib/auth');
      const { verifyOTP } = await import('@/lib/otp');
      const session = await verifySession(sessionToken);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session invalide ou expirée' }, { status: 401 });
      }
      const result = await verifyOTP(session.id, code);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error || 'Code invalide ou expiré.' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Compte vérifié avec succès !' });
    }

    return NextResponse.json({ success: false, error: 'Veuillez recommencer l\'inscription.' }, { status: 401 });
  } catch (error) {
    logger.error('Erreur vérification OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la vérification' },
      { status: 500 }
    );
  }
}
