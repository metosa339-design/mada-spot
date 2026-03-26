import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';

import { logger } from '@/lib/logger';
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://madaspot.mg';

// POST /api/auth/verify-email - Send verification email to current user
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const rl = checkRateLimit(clientId, 'auth');
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez plus tard.', retryAfter: rl.resetIn },
        { status: 429, headers: getRateLimitHeaders(rl) }
      );
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return apiError('Non autorisé', 401);

    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: 'Session invalide' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Pas d\'email associé au compte' }, { status: 400 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ success: true, message: 'Email déjà vérifié' });
    }

    // Generate verification token (stored in PasswordReset table for simplicity)
    const verifyToken = crypto.randomBytes(32).toString('hex');
    await prisma.passwordReset.create({
      data: {
        email: user.email,
        token: verifyToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    const verifyUrl = `${SITE_BASE}/api/auth/verify-email?token=${verifyToken}`;

    // Send email
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: 'Vérifiez votre email - Mada Spot',
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #ff6b35, #ff1493); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 22px;">Mada Spot</h1>
              </div>
              <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px;">
                <h2 style="margin-top: 0;">Bienvenue ${(user.firstName || '').replace(/[&<>"']/g, (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))} !</h2>
                <p>Cliquez sur le bouton ci-dessous pour vérifier votre adresse email :</p>
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ff6b35, #ff1493); color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
                    Vérifier mon email
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 13px;">Ce lien expire dans 24 heures.</p>
              </div>
            </div>
          `,
          secret: process.env.EMAIL_SECRET,
        }),
      });
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
    }

    return NextResponse.json({ success: true, message: 'Email de vérification envoyé' });
  } catch (error) {
    logger.error('Error sending verification email:', error);
    return apiError('Erreur serveur', 500);
  }
}

// GET /api/auth/verify-email?token=xxx - Verify email with token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(`${SITE_BASE}/login?error=token_missing`);
    }

    // Find and validate token
    const reset = await prisma.passwordReset.findUnique({ where: { token } });

    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
      return NextResponse.redirect(`${SITE_BASE}/login?error=token_invalid`);
    }

    // Mark email as verified
    await prisma.user.updateMany({
      where: { email: reset.email },
      data: { emailVerified: true },
    });

    // Mark token as used
    await prisma.passwordReset.update({
      where: { token },
      data: { usedAt: new Date() },
    });

    return NextResponse.redirect(`${SITE_BASE}/login?verified=true`);
  } catch (error) {
    logger.error('Error verifying email:', error);
    return NextResponse.redirect(`${SITE_BASE}/login?error=server_error`);
  }
}
