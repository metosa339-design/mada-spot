import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return apiError('Non authentifie', 401);
    }

    const user = await verifySession(token);
    if (!user) {
      return apiError('Session invalide', 401);
    }

    // Start of today (UTC)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [unreadMessages, todayBookings, notifications] = await Promise.all([
      // Count unread messages where user is the receiver
      prisma.message.count({
        where: {
          receiverId: user.id,
          isRead: false,
        },
      }),

      // Count today's bookings for establishments claimed by user
      prisma.booking.count({
        where: {
          establishment: {
            claimedByUserId: user.id,
          },
          checkIn: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // Count unread notifications
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
    ]);

    return apiSuccess({
      unreadMessages,
      todayBookings,
      notifications,
    });
  } catch (error) {
    logger.error('Erreur recuperation badges dashboard:', error);
    return apiError('Erreur serveur', 500);
  }
}
