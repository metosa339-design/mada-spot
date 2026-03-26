import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';

import { logger } from '@/lib/logger';
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      );
    }

    const user = await getSession(sessionId);

    if (!user) {
      const response = NextResponse.json(
        { success: false, authenticated: false },
        { status: 401 }
      );

      // Clear invalid session cookie
      response.cookies.set(ADMIN_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });

      return response;
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Session error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
