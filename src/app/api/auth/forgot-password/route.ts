import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { createPasswordResetToken } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';

import { logger } from '@/lib/logger';
const SITE_BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://madaspot.com';

// POST /api/auth/forgot-password - Request a password reset link
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

    const _body = await request.json().catch(() => null);
    if (_body === null) return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    const { email } = _body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format d\'email invalide' }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const token = await createPasswordResetToken(email);

    if (token) {
      const resetUrl = `${SITE_BASE}/reset-password?token=${token}`;

      // Send email via the email API
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/email/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: 'Réinitialisation de votre mot de passe - Mada Spot',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #ff6b35, #ff1493); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 22px;">Mada Spot</h1>
                </div>
                <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px;">
                  <h2 style="margin-top: 0;">Réinitialisation de mot de passe</h2>
                  <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
                  <div style="text-align: center; margin: 24px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #ff6b35, #ff1493); color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
                      Réinitialiser mon mot de passe
                    </a>
                  </div>
                  <p style="color: #6b7280; font-size: 13px;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
                </div>
              </div>
            `,
            secret: process.env.EMAIL_SECRET,
          }),
        });
      } catch (emailError) {
        logger.error('Failed to send reset email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    });
  } catch (error) {
    logger.error('Error in forgot-password:', error);
    return apiError('Erreur serveur', 500);
  }
}
