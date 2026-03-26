import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api-response';
import { logger } from '@/lib/logger';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return apiError('Non authentifié', 401);

    const user = await verifySession(token);
    if (!user) return apiError('Session invalide', 401);

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || '30d';
    const periodDays = periodParam === '7d' ? 7 : periodParam === '90d' ? 90 : 30;

    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - 2 * periodDays * 24 * 60 * 60 * 1000);

    // Get establishments owned by user
    const establishments = await prisma.establishment.findMany({
      where: { claimedByUserId: user.id },
      select: { id: true },
    });
    const estIds = establishments.map(e => e.id);

    if (estIds.length === 0) {
      return apiSuccess({
        funnel: { views: 0, inquiries: 0, bookings: 0, completed: 0 },
        occupancyByDay: DAY_LABELS.map(day => ({ day, rate: 0 })),
        revenueComparison: { current: [], previous: [] },
      });
    }

    // Funnel data
    const [views, inquiries, bookings, completed] = await Promise.all([
      prisma.establishmentView.count({
        where: { establishmentId: { in: estIds }, createdAt: { gte: periodStart } },
      }),
      prisma.message.count({
        where: { receiverId: user.id, createdAt: { gte: periodStart } },
      }),
      prisma.booking.count({
        where: { establishmentId: { in: estIds }, createdAt: { gte: periodStart } },
      }),
      prisma.booking.count({
        where: {
          establishmentId: { in: estIds },
          createdAt: { gte: periodStart },
          status: { in: ['COMPLETED', 'CONFIRMED'] },
        },
      }),
    ]);

    // Occupancy by day of week
    const bookingsByDay = await prisma.booking.findMany({
      where: {
        establishmentId: { in: estIds },
        createdAt: { gte: periodStart },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      select: { checkIn: true },
    });

    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    bookingsByDay.forEach(b => {
      if (b.checkIn) {
        const day = new Date(b.checkIn).getDay();
        dayCounts[day]++;
      }
    });
    const maxDay = Math.max(...dayCounts, 1);
    const occupancyByDay = DAY_LABELS.map((day, i) => ({
      day,
      rate: Math.round((dayCounts[i] / maxDay) * 100) / 100,
    }));

    // Revenue comparison: current vs previous period in weekly buckets
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const numWeeks = Math.ceil(periodDays / 7);

    const [currentBookingsRev, previousBookingsRev] = await Promise.all([
      prisma.booking.findMany({
        where: {
          establishmentId: { in: estIds },
          createdAt: { gte: periodStart },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
        select: { totalPrice: true, createdAt: true },
      }),
      prisma.booking.findMany({
        where: {
          establishmentId: { in: estIds },
          createdAt: { gte: previousPeriodStart, lt: periodStart },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
        },
        select: { totalPrice: true, createdAt: true },
      }),
    ]);

    const bucketize = (items: { totalPrice: number | null; createdAt: Date }[], start: Date) => {
      const buckets: { label: string; value: number }[] = [];
      for (let w = 0; w < numWeeks; w++) {
        const wStart = new Date(start.getTime() + w * weekMs);
        const wEnd = new Date(wStart.getTime() + weekMs);
        const total = items
          .filter(b => b.createdAt >= wStart && b.createdAt < wEnd)
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        buckets.push({ label: `S${w + 1}`, value: Math.round(total) });
      }
      return buckets;
    };

    return apiSuccess({
      funnel: { views, inquiries, bookings, completed },
      occupancyByDay,
      revenueComparison: {
        current: bucketize(currentBookingsRev, periodStart),
        previous: bucketize(previousBookingsRev, previousPeriodStart),
      },
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    return apiError('Erreur serveur', 500);
  }
}
