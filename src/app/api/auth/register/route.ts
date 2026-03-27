// API Route - Inscription (Pending)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { registerSchema } from '@/lib/validations/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  try {
    const clientId = request.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResult = checkRateLimit(clientId, 'auth');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { success: false, error: 'Trop de tentatives. Réessayez plus tard.', retryAfter: rateLimitResult.resetIn },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    if (!body.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return NextResponse.json({ success: false, error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, phone, password, firstName, lastName, role, userType } = validationResult.data;

    // Check if email already exists in real users
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ success: false, error: 'Cet email est déjà utilisé' }, { status: 409 });
      }
    }

    if (phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone } });
      if (existingPhone) {
        return NextResponse.json({ success: false, error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 409 });
      }
    }

    // Delete any existing pending registration for this email (allow retry)
    if (email) {
      await prisma.pendingRegistration.deleteMany({ where: { email } });
    }

    const passwordHash = await hashPassword(password);
    const otpCode = generateOTP();
    const token = crypto.randomBytes(32).toString('hex');

    // Create pending registration (NOT a real user)
    await prisma.pendingRegistration.create({
      data: {
        email: email || null,
        phone: phone || null,
        password: passwordHash,
        firstName,
        lastName,
        role,
        userType: userType || null,
        otpCode,
        otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // Send OTP email
    let emailSent = false;
    if (email) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: `${otpCode} — Votre code de vérification Mada Spot`,
            html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#0f0f17"><div style="background:linear-gradient(135deg,#ff6b35,#ff1493);padding:32px 20px;border-radius:12px 12px 0 0;text-align:center"><h1 style="color:white;margin:0;font-size:26px">Mada Spot</h1><p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">Bons Plans à Madagascar</p></div><div style="background:#f8fafc;padding:32px 24px;border-radius:0 0 12px 12px"><h2 style="margin:0 0 8px;color:#1a1a24;font-size:20px">Bienvenue ${firstName} !</h2><p style="color:#64748b;font-size:15px;margin:0 0 24px">Utilisez le code ci-dessous pour valider votre adresse email.</p><div style="text-align:center;margin:24px 0;font-size:32px;font-weight:bold;letter-spacing:8px;color:#ff6b35">${otpCode}</div><p style="text-align:center;color:#94a3b8;font-size:13px">Ce code expire dans 15 minutes.</p></div></div>`,
            secret: process.env.EMAIL_SECRET,
          }),
        });
        emailSent = res.ok;
      } catch (err) {
        logger.error('[REGISTER] Email send error:', err);
      }
    }

    const response = NextResponse.json(
      {
        success: true,
        message: 'Code de vérification envoyé. Vérifiez votre email.',
        needsVerification: true,
        emailSent,
        user: { email, firstName, lastName, role },
      },
      { status: 201 }
    );

    // Set pending token cookie (NOT a session cookie)
    response.cookies.set({
      name: 'mada-spot-pending',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24h
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('Erreur inscription:', error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    );
  }
}
