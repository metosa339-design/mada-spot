import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'mada-spot-session';
const ADMIN_COOKIE = 'mada-spot-admin-session';

// Routes protégées nécessitant une session utilisateur
const PROTECTED_USER_ROUTES = ['/client', '/establishment', '/dashboard'];

// Routes protégées nécessitant une session admin
const PROTECTED_ADMIN_ROUTES = ['/admin'];

// Routes d'auth (rediriger si déjà connecté)
const AUTH_ROUTES = ['/login', '/register', '/register-client', '/forgot-password', '/reset-password'];

// Route de vérification (accessible seulement si connecté mais non vérifié)
const VERIFY_ROUTE = '/verify-account';

// Security headers appliqués à toutes les réponses
const isDev = process.env.NODE_ENV !== 'production';

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Content-Security-Policy': [
    "default-src 'self'",
    // Turbopack (dev) utilise eval() pour charger les modules — 'unsafe-eval' nécessaire uniquement en dev
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src 'self'${isDev ? ' ws://localhost:* http://localhost:*' : ''} https://www.google-analytics.com https://vitals.vercel-insights.com https://*.tile.openstreetmap.org https://res.cloudinary.com https://open.er-api.com https://*.vercel.app`,
    "frame-src 'self' https://www.google.com",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join('; '),
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasUserSession = request.cookies.has(SESSION_COOKIE);
  const hasAdminSession = request.cookies.has(ADMIN_COOKIE);

  // Protection routes admin
  if (PROTECTED_ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    // Exception : /admin/login n'est pas protégé
    if (pathname === '/admin/login') return applySecurityHeaders(NextResponse.next());

    if (!hasAdminSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('redirect', pathname);
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  // Protection routes utilisateur
  if (PROTECTED_USER_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!hasUserSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  // Page de vérification : accessible seulement si connecté
  if (pathname.startsWith(VERIFY_ROUTE)) {
    if (!hasUserSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return applySecurityHeaders(NextResponse.redirect(url));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // Rediriger les utilisateurs déjà connectés hors des pages d'auth
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (hasUserSession) {
      const url = request.nextUrl.clone();
      url.pathname = '/client';
      return applySecurityHeaders(NextResponse.redirect(url));
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icons/|manifest\\.json).*)',
  ],
};
