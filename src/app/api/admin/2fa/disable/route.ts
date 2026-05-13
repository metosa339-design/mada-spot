// POST /api/admin/2fa/disable — requires a valid current TOTP code to disable 2FA.
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
      select: { totpSecret: true, totpEnabled: true },
    });
    if (!user?.totpEnabled || !user.totpSecret) {
      return NextResponse.json({ success: false, error: '2FA non activée.' }, { status: 400 });
    }

    if (!verifyTotp(user.totpSecret, code)) {
      return NextResponse.json({ success: false, error: 'Code incorrect.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: admin.id },
      data: { totpSecret: null, totpEnabled: false, totpVerifiedAt: null },
    });

    logAudit({ userId: admin.id, action: '2fa_disabled', entityType: 'user', entityId: admin.id, ...getRequestMeta(request) });
    return NextResponse.json({ success: true, message: '2FA désactivée.' });
  } catch (error) {
    logger.error('[2FA disable] error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
