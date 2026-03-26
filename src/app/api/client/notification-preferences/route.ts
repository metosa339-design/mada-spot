import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { verifyCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';

const ALL_TYPES = [
  'SYSTEM',
  'CLAIM_SUBMITTED',
  'CLAIM_APPROVED',
  'CLAIM_REJECTED',
  'IMPORT_COMPLETED',
  'BOOKING_NEW',
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'BOOKING_COMPLETED',
  'REVIEW_NEW',
  'MESSAGE_NEW',
  'EVENT_NEW',
  'GHOST_CREATED',
];

function getDefaultPreferences(): Record<string, boolean> {
  const prefs: Record<string, boolean> = {};
  for (const t of ALL_TYPES) prefs[t] = true;
  return prefs;
}

// GET /api/client/notification-preferences
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return apiError('Non autorisé', 401);

    const session = await verifySession(token);
    if (!session) return apiError('Session invalide', 401);

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { notificationPreferences: true },
    });

    if (!user) return apiError('Utilisateur non trouvé', 404);

    const defaults = getDefaultPreferences();
    const stored = (user.notificationPreferences as Record<string, boolean> | null) || {};
    const preferences = { ...defaults, ...stored };

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    return apiError('Erreur serveur', 500);
  }
}

// PUT /api/client/notification-preferences
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return apiError('Non autorisé', 401);

    const session = await verifySession(token);
    if (!session) return apiError('Session invalide', 401);

    const data = await request.json().catch(() => null);
    if (!data) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });

    if (!data.csrfToken || !verifyCsrfToken(data.csrfToken)) {
      return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
    }

    const { preferences } = data;
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json({ error: 'Préférences invalides' }, { status: 400 });
    }

    // Validate keys
    const clean: Record<string, boolean> = {};
    for (const key of ALL_TYPES) {
      clean[key] = preferences[key] !== false;
    }

    await prisma.user.update({
      where: { id: session.id },
      data: { notificationPreferences: clean },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    return apiError('Erreur serveur', 500);
  }
}
