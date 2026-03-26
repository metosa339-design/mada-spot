import { NextRequest, NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/auth';
import { createAdminSession } from '@/lib/auth/admin-session';
import { loginSchema, validateData } from '@/lib/validations';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { verifyCsrfToken } from '@/lib/csrf';

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    // Rate limiting for auth (strict: 5 attempts per 15 minutes)
    const clientId = getClientIdentifier(request);
    const rateLimit = checkRateLimit(clientId, 'auth');

    if (!rateLimit.success) {
      const response = NextResponse.json(
        { success: false, error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429 }
      );
      Object.entries(getRateLimitHeaders(rateLimit)).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const body = await request.json().catch(() => null);

    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // CSRF verification (mandatory)
    if (!body.csrfToken || !verifyCsrfToken(body.csrfToken)) {
      return NextResponse.json(
        { success: false, error: 'Token CSRF invalide ou manquant. Rafraîchissez la page.' },
        { status: 403 }
      );
    }

    // Validate input with Zod
    const validation = validateData(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: validation.errors },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;
    const user = await validateCredentials(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    const sessionId = await createAdminSession(user);

    // Audit log
    const meta = getRequestMeta(request);
    logAudit({ userId: user.id, action: 'login', entityType: 'user', entityId: user.id, details: { username: user.username }, ...meta });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

    // Set session cookie - use root path so it's sent with API requests
    response.cookies.set(ADMIN_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
