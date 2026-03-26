import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/admin-session';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';

/**
 * Shared admin authentication check for API routes.
 * Returns the admin user if authenticated, null otherwise.
 */
export async function checkAdminAuth(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionId) return null;
  return getSession(sessionId);
}
