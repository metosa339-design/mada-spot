// POST /api/auth/resend-otp — Resend OTP for email verification
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOTPEmail(email: string, code: string, firstName?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  await fetch(`${baseUrl}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      subject: `${code} — Votre code de vérification Mada Spot`,
      html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#ff6b35,#ff1493);padding:20px;text-align:center;border-radius:12px 12px 0 0"><h1 style="color:white;margin:0">Mada Spot</h1></div><div style="background:#f8fafc;padding:24px;border-radius:0 0 12px 12px"><h2>Bonjour${firstName ? ` ${firstName}` : ''} !</h2><p>Voici votre nouveau code de vérification :</p><div style="text-align:center;margin:20px 0;font-size:32px;font-weight:bold;letter-spacing:8px;color:#ff6b35">${code}</div><p style="color:#666">Ce code expire dans 24 heures.</p></div></div>`,
      secret: process.env.EMAIL_SECRET,
    }),
  });
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

    // Try pending cookie first (old flow)
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
        data: { otpCode: newCode, otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      });

      try {
        await sendOTPEmail(pending.email, newCode, pending.firstName);
      } catch (err) {
        logger.error('[RESEND_OTP] Email error:', err);
        return NextResponse.json({ success: false, error: "Impossible d'envoyer le code" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Nouveau code envoyé par email' });
    }

    // Session-based flow (user logged in, verifying from dashboard)
    const sessionUser = await getAuthUser(request);

    if (sessionUser) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { email: true, firstName: true, emailVerified: true, password: true, lastName: true, role: true, userType: true },
      });

      if (!user?.email) return NextResponse.json({ success: false, error: "Pas d'email associé" }, { status: 400 });
      if (user.emailVerified) return NextResponse.json({ success: true, message: 'Email déjà vérifié' });

      const newCode = generateOTP();

      // Upsert pending registration for OTP storage
      const existing = await prisma.pendingRegistration.findFirst({ where: { email: user.email } });
      if (existing) {
        await prisma.pendingRegistration.update({
          where: { id: existing.id },
          data: { otpCode: newCode, otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
        });
      } else {
        await prisma.pendingRegistration.create({
          data: {
            email: user.email,
            password: user.password,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            userType: user.userType,
            otpCode: newCode,
            otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            token: `resend-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });
      }

      try {
        await sendOTPEmail(user.email, newCode, user.firstName);
      } catch (err) {
        logger.error('[RESEND_OTP] Email error:', err);
        return NextResponse.json({ success: false, error: "Impossible d'envoyer le code" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Nouveau code envoyé par email' });
    }

    return NextResponse.json({ success: false, error: "Veuillez vous connecter." }, { status: 401 });
  } catch (error) {
    logger.error('Erreur resend OTP:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
