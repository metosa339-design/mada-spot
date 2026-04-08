// API Route - Inscription (directe, sans vérification email bloquante)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, createSession, getSessionCookieConfig } from '@/lib/auth';
import { registerSchema } from '@/lib/validations/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyCsrfToken } from '@/lib/csrf';
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

    // Check if email already exists
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

    const passwordHash = await hashPassword(password);

    // Create the real user directly (email verification will be prompted in dashboard)
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email || null,
          phone: phone || null,
          password: passwordHash,
          firstName,
          lastName,
          role,
          userType: userType || null,
          emailVerified: false,
          isVerified: false,
        },
      });

      if (role === 'CLIENT') {
        await tx.clientProfile.create({ data: { userId: newUser.id } });
      }

      return newUser;
    });

    // Create session immediately
    const deviceInfo = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || undefined;
    const sessionToken = await createSession(user.id, deviceInfo, ipAddress);

    // Send verification email in background (non-blocking)
    if (email) {
      const otpCode = generateOTP();
      try {
        // Store OTP for later verification
        await prisma.pendingRegistration.create({
          data: {
            email,
            phone: phone || null,
            password: passwordHash,
            firstName,
            lastName,
            role,
            userType: userType || null,
            otpCode,
            otpExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h for email verification
            token: sessionToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: `${otpCode} — Confirmez votre email Mada Spot`,
            html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#ff6b35,#ff1493);padding:32px 20px;border-radius:12px 12px 0 0;text-align:center"><h1 style="color:white;margin:0;font-size:26px">Mada Spot</h1><p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">Bons Plans à Madagascar</p></div><div style="background:#f8fafc;padding:32px 24px;border-radius:0 0 12px 12px"><h2 style="margin:0 0 8px;color:#1a1a24;font-size:20px">Bienvenue ${firstName} !</h2><p style="color:#64748b;font-size:15px;margin:0 0 24px">Votre compte a été créé avec succès. Pour confirmer votre adresse email, utilisez ce code :</p><div style="text-align:center;margin:24px 0;font-size:32px;font-weight:bold;letter-spacing:8px;color:#ff6b35">${otpCode}</div><p style="text-align:center;color:#94a3b8;font-size:13px">Vous pouvez confirmer votre email à tout moment depuis votre espace.</p></div></div>`,
            secret: process.env.EMAIL_SECRET,
          }),
        }).catch((err) => logger.error('[REGISTER] Email send error:', err));
      } catch (err) {
        logger.error('[REGISTER] OTP storage error:', err);
      }
    }

    logger.info(`[REGISTER] ✓ Account created for ${email} (verification pending)`);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Compte créé avec succès ! Bienvenue sur Mada Spot.',
        user: { email, firstName, lastName, role },
      },
      { status: 201 }
    );

    // Set session cookie (user is logged in immediately)
    const cookieConfig = getSessionCookieConfig(sessionToken);
    response.cookies.set(cookieConfig);

    return response;
  } catch (error) {
    logger.error('Erreur inscription:', error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de l'inscription" },
      { status: 500 }
    );
  }
}
