import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';

import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: get userId from regular auth session or admin session cookie
async function resolveUserId(request: NextRequest): Promise<string | null> {
  // Try regular auth session (mada-spot-session cookie)
  const authUser = await getAuthUser(request);
  if (authUser) return authUser.id;

  // Fallback for admin-only session: look up admin user in DB
  const adminSessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (adminSessionId) {
    // Admin users are stored in the DB with role ADMIN
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
      select: { id: true },
    });
    if (adminUser) return adminUser.id;
  }

  return null;
}

// ---------------------------------------------------
// GET - Lister les notifications de l'utilisateur connecté
// Supporte ?limit=20 et ?unreadOnly=true
// ---------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const where: { userId: string; isRead?: boolean } = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    logger.error('Erreur récupération notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------
// PATCH - Marquer des notifications comme lues
// Body: { notificationIds: string[] } ou { markAllRead: true }
// ---------------------------------------------------
export async function PATCH(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);


    if (body === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });
    } else if (notificationIds?.length > 0) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
        },
        data: { isRead: true, readAt: new Date() },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'notificationIds ou markAllRead requis' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erreur mise à jour notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
