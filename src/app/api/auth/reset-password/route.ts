import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { verifyPasswordResetToken, markPasswordResetUsed, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';

import { logger } from '@/lib/logger';
// POST /api/auth/reset-password - Reset password with token
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
    const { token, newPassword } = _body;

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token et nouveau mot de passe requis' }, { status: 400 });
    }

    // Strong password validation (same rules as registration)
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères' }, { status: 400 });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins une majuscule' }, { status: 400 });
    }
    if (!/[a-z]/.test(newPassword)) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins une minuscule' }, { status: 400 });
    }
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins un chiffre' }, { status: 400 });
    }

    // Verify token
    const email = await verifyPasswordResetToken(token);
    if (!email) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 });
    }

    // Hash new password and update user
    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await markPasswordResetUsed(token);

    // Delete all existing sessions for this user (force re-login)
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (user) {
      await prisma.session.deleteMany({ where: { userId: user.id } });
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    logger.error('Error in reset-password:', error);
    return apiError('Erreur serveur', 500);
  }
}
