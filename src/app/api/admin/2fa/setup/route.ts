// POST /api/admin/2fa/setup — generates a fresh TOTP secret for the current admin.
// The secret is stored but NOT marked enabled until /verify-setup is called with a valid code.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/admin-session';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';
import { generateSecret, otpauthUrl } from '@/lib/totp';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(getClientIdentifier(request), 'auth');
    if (!rl.success) {
      return NextResponse.json({ success: false, error: 'Trop de tentatives.' }, { status: 429 });
    }

    const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const admin = cookie ? await getSession(cookie) : null;
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body?.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return NextResponse.json({ success: false, error: 'Token CSRF invalide' }, { status: 403 });
    }

    const secret = generateSecret();
    await prisma.user.update({
      where: { id: admin.id },
      data: { totpSecret: secret, totpEnabled: false, totpVerifiedAt: null },
    });

    const url = otpauthUrl(secret, admin.username, 'Mada Spot Admin');
    return NextResponse.json({ success: true, secret, otpauthUrl: url });
  } catch (error) {
    logger.error('[2FA setup] error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
