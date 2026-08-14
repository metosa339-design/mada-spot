// Mada Spot — Admin billetterie : garde de session admin + CSRF.

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/admin-session';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';
import { verifyCsrfToken } from '@/lib/csrf';

export interface AdminIdentity {
  id: string;
  username: string;
  role: string;
}

/**
 * Exige une session administrateur valide (cookie panel admin). Retourne
 * l'admin ou une réponse 401.
 */
export async function requireAdminSession(
  request: NextRequest
): Promise<{ admin: AdminIdentity } | NextResponse> {
  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const admin = cookie ? await getSession(cookie) : null;
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });
  }
  return { admin };
}

/** Vérifie le jeton CSRF d'une mutation admin (fourni dans le corps JSON). */
export function ensureCsrf(body: unknown): NextResponse | null {
  const token = (body as { csrfToken?: string } | null)?.csrfToken;
  if (!token || !verifyCsrfToken(token)) {
    return NextResponse.json({ success: false, error: 'Jeton CSRF invalide' }, { status: 403 });
  }
  return null;
}
