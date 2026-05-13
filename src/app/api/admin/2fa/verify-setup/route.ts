// POST /api/admin/2fa/verify-setup — admin enters a code from their auth app to confirm
// the secret is correctly configured. On success, totpEnabled = true.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth/admin-session';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';
import { verifyTotp } from '@/lib/totp';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { logAudit, getRequestMeta } from '@/lib/audit';
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

    const code: unknown = body.code;
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: 'Code invalide' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: admin.id },
      select: { totpSecret: true },
    });
    if (!user?.totpSecret) {
      return NextResponse.json({ success: false, error: 'Aucun secret en attente. Relancez /setup.' }, { status: 400 });
    }

    if (!verifyTotp(user.totpSecret, code)) {
      return NextResponse.json({ success: false, error: 'Code incorrect.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: admin.id },
      data: { totpEnabled: true, totpVerifiedAt: new Date() },
    });

    logAudit({ userId: admin.id, action: '2fa_enabled', entityType: 'user', entityId: admin.id, ...getRequestMeta(request) });
    return NextResponse.json({ success: true, message: '2FA activée.' });
  } catch (error) {
    logger.error('[2FA verify-setup] error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
