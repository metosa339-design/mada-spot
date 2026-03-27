// POST /api/auth/resend-otp — Resend OTP for pending registration
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

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

    // Try new flow first (pending cookie)
    const pendingToken = request.cookies.get('mada-spot-pending')?.value;

    if (pendingToken) {
      const pending = await prisma.pendingRegistration.findUnique({ where: { token: pendingToken } });

      if (!pending || !pending.email) {
        return NextResponse.json({ success: false, error: 'Inscription expirée. Veuillez recommencer.' }, { status: 401 });
      }

      if (pending.expiresAt < new Date()) {
        await prisma.pendingRegistration.delete({ where: { id: pending.id } });
        return NextResponse.json({ success: false, error: 'Inscription expirée. Veuillez recommencer.' }, { status: 401 });
      }

      const newCode = generateOTP();
      await prisma.pendingRegistration.update({
        where: { id: pending.id },
        data: { otpCode: newCode, otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000) },
      });

      // Send email
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: pending.email,
            subject: `${newCode} — Votre code de vérification Mada Spot`,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#ff6b35,#ff1493);padding:20px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:white;margin:0">Mada Spot</h1></div><div style="background:#f8fafc;padding:24px;border-radius:0 0 12px 12px"><h2>Nouveau code</h2><div style="text-align:center;margin:20px 0;font-size:32px;font-weight:bold;letter-spacing:8px;color:#ff6b35">${newCode}</div><p style="color:#666">Ce code expire dans 15 minutes.</p></div></div>`,
            secret: process.env.EMAIL_SECRET,
          }),
        });
      } catch (err) {
        logger.error('[RESEND_OTP] Email error:', err);
        return NextResponse.json({ success: false, error: "Impossible d'envoyer le code" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Nouveau code envoyé par email' });
    }

    // Backward compatibility: old flow with session
    const sessionToken = request.cookies.get('mada-spot-session')?.value;
    if (sessionToken) {
      const { verifySession } = await import('@/lib/auth');
      const { sendOTPToUser } = await import('@/lib/otp');
      const session = await verifySession(sessionToken);
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session invalide' }, { status: 401 });
      }
      const user = await prisma.user.findUnique({ where: { id: session.id }, select: { email: true, firstName: true, isVerified: true } });
      if (!user?.email) return NextResponse.json({ success: false, error: "Pas d'email" }, { status: 400 });
      if (user.isVerified) return NextResponse.json({ success: true, message: 'Compte déjà vérifié' });
      const result = await sendOTPToUser(session.id, user.email, user.firstName || undefined);
      if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: 429 });
      return NextResponse.json({ success: true, message: 'Nouveau code envoyé' });
    }

    return NextResponse.json({ success: false, error: "Veuillez recommencer l'inscription." }, { status: 401 });
  } catch (error) {
    logger.error('Erreur resend OTP:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
