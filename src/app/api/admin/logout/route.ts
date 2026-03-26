import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (sessionId) {
      await deleteSession(sessionId);
    }

    const response = NextResponse.json({ success: true });

    // Clear session cookie
    response.cookies.set(ADMIN_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    logger.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
