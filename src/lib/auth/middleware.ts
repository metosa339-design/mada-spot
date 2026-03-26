// Middleware d'authentification pour les API routes
import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE_NAME, type SessionUser } from './session';
import type { UserRole } from '@prisma/client';

export type { SessionUser };

/**
 * Extrait et vérifie la session depuis les cookies de la requête
 */
export async function getAuthUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/**
 * Middleware qui vérifie l'authentification
 * Retourne l'utilisateur ou une réponse 401
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: SessionUser } | NextResponse> {
  const user = await getAuthUser(request);

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Non autorisé' },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Middleware qui vérifie l'authentification et le rôle
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: SessionUser } | NextResponse> {
  const result = await requireAuth(request);

  if (result instanceof NextResponse) {
    return result;
  }

  if (!allowedRoles.includes(result.user.role)) {
    return NextResponse.json(
      { success: false, error: 'Accès refusé' },
      { status: 403 }
    );
  }

  return result;
}

/**
 * Vérifie si l'utilisateur est admin
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: SessionUser } | NextResponse> {
  return requireRole(request, ['ADMIN']);
}

/**
 * Vérifie si l'utilisateur est un client
 */
export async function requireClient(
  request: NextRequest
): Promise<{ user: SessionUser } | NextResponse> {
  return requireRole(request, ['CLIENT', 'ADMIN']);
}

/**
 * Vérifie que l'utilisateur est authentifié ET vérifié (isVerified === true)
 * Bloque l'accès aux dashboards tant que le compte n'est pas activé.
 */
export async function requireVerified(
  request: NextRequest
): Promise<{ user: SessionUser } | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  // Check isVerified via DB lookup
  const { prisma } = await import('@/lib/db');
  const user = await prisma.user.findUnique({
    where: { id: result.user.id },
    select: { isVerified: true, role: true },
  });

  // Admins bypass verification requirement
  if (user?.role === 'ADMIN') return result;

  if (!user?.isVerified) {
    return NextResponse.json(
      { success: false, error: 'Compte non vérifié. Veuillez valider votre email.', code: 'UNVERIFIED' },
      { status: 403 }
    );
  }

  return result;
}

/**
 * Configuration des cookies de session
 */
export function getSessionCookieConfig(token: string, maxAge: number = 7 * 24 * 60 * 60) {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

/**
 * Configuration pour supprimer le cookie de session
 */
export function getClearSessionCookieConfig() {
  return {
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}
