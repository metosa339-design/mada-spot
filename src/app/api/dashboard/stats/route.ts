import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { apiError, apiSuccess } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
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

    // Parse period from query param
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get('period') || '30d';
    const periodDays = periodParam === '7d' ? 7 : periodParam === '90d' ? 90 : 30;

    // Get all establishments claimed by the user
    const establishments = await prisma.establishment.findMany({
      where: { claimedByUserId: user.id },
      select: {
        id: true,
        viewCount: true,
        rating: true,
        reviewCount: true,
      },
    });

    const establishmentIds = establishments.map((e) => e.id);

    // Date ranges (dynamic based on period)
    const now = new Date();
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - 2 * periodDays * 24 * 60 * 60 * 1000);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ---- Current period (last 30 days) ----
    const [
      currentBookings,
      currentRevenueResult,
      currentViews,
      unreadMessages,
      todayBookings,
      pendingBookings,
    ] = await Promise.all([
      // Total bookings in the last 30 days
      prisma.booking.count({
        where: {
          establishmentId: { in: establishmentIds },
          createdAt: { gte: periodStart },
        },
      }),

      // Total revenue from confirmed/completed bookings in last 30 days
      prisma.booking.aggregate({
        where: {
          establishmentId: { in: establishmentIds },
          status: { in: ['confirmed', 'completed'] },
          createdAt: { gte: periodStart },
        },
        _sum: { totalPrice: true },
      }),

      // Views in the last 30 days (from EstablishmentView table)
      prisma.establishmentView.count({
        where: {
          establishmentId: { in: establishmentIds },
          createdAt: { gte: periodStart },
        },
      }),

      // Unread messages
      prisma.message.count({
        where: {
          receiverId: user.id,
          isRead: false,
        },
      }),

      // Today's bookings
      prisma.booking.count({
        where: {
          establishmentId: { in: establishmentIds },
          checkIn: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),

      // Pending bookings (awaiting provider action)
      prisma.booking.count({
        where: {
          establishmentId: { in: establishmentIds },
          status: 'pending',
        },
      }),
    ]);

    // ---- Previous period (30-60 days ago) for trends ----
    const [
      previousBookings,
      previousRevenueResult,
      previousViews,
    ] = await Promise.all([
      prisma.booking.count({
        where: {
          establishmentId: { in: establishmentIds },
          createdAt: { gte: previousPeriodStart, lt: periodStart },
        },
      }),

      prisma.booking.aggregate({
        where: {
          establishmentId: { in: establishmentIds },
          status: { in: ['confirmed', 'completed'] },
          createdAt: { gte: previousPeriodStart, lt: periodStart },
        },
        _sum: { totalPrice: true },
      }),

      prisma.establishmentView.count({
        where: {
          establishmentId: { in: establishmentIds },
          createdAt: { gte: previousPeriodStart, lt: periodStart },
        },
      }),
    ]);

    // Previous period average rating (reviews created 30-60 days ago)
    const previousRatingResult = await prisma.establishmentReview.aggregate({
      where: {
        establishmentId: { in: establishmentIds },
        createdAt: { gte: previousPeriodStart, lt: periodStart },
      },
      _avg: { rating: true },
    });

    // Compute aggregated stats from establishments
    const totalViews = establishments.reduce((sum, e) => sum + e.viewCount, 0);
    const totalReviews = establishments.reduce((sum, e) => sum + e.reviewCount, 0);
    const averageRating =
      establishments.length > 0
        ? establishments.reduce((sum, e) => sum + e.rating, 0) / establishments.length
        : 0;

    const totalBookings = currentBookings;
    const totalRevenue = currentRevenueResult._sum.totalPrice || 0;

    // CTR: (totalBookings / totalViews * 100) or 0
    const ctr = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;

    // Trend calculations: percentage change vs previous period
    function calcTrend(current: number, previous: number): number {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    }

    const previousRevenue = previousRevenueResult._sum.totalPrice || 0;
    const previousAvgRating = previousRatingResult._avg.rating || 0;

    const viewsTrend = calcTrend(currentViews, previousViews);
    const bookingsTrend = calcTrend(currentBookings, previousBookings);
    const revenueTrend = calcTrend(totalRevenue, previousRevenue);
    const ratingTrend = calcTrend(averageRating, previousAvgRating);

    // ---- Recent bookings (last 10) ----
    const recentBookings = await prisma.booking.findMany({
      where: {
        establishmentId: { in: establishmentIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        reference: true,
        guestName: true,
        guestCount: true,
        checkIn: true,
        checkOut: true,
        status: true,
        totalPrice: true,
        bookingType: true,
        createdAt: true,
        establishment: {
          select: {
            name: true,
            type: true,
          },
        },
      },
    });

    // ---- Recent reviews (last 10) ----
    const recentReviews = await prisma.establishmentReview.findMany({
      where: {
        establishmentId: { in: establishmentIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        authorName: true,
        createdAt: true,
        establishment: {
          select: {
            name: true,
            coverImage: true,
          },
        },
      },
    });

    // ---- Hotel-specific stats ----
    let hotelStats: {
      occupancyRate: number
      monthlyRevenue: number
      monthlyRevenueChange: number
      monthlyBookingsCount: number
      monthlyBookingsChange: number
      avgResponseTimeHours: number
      todayArrivals: Array<{
        guestName: string
        guestCount: number
        reference: string
        roomTypeName: string | null
        checkIn: string
        checkOut: string | null
        status: string
      }>
      pendingList: Array<{
        id: string
        guestName: string
        guestPhone: string | null
        guestCount: number
        checkIn: string
        checkOut: string | null
        reference: string
        totalPrice: number | null
        roomTypeName: string | null
        createdAt: string
      }>
    } | null = null;

    if (user.userType === 'HOTEL' && establishmentIds.length > 0) {
      const estId = establishmentIds[0];

      // Current month range
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      // Previous month range
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Total room count
      const totalRooms = await prisma.roomType.count({
        where: { hotel: { establishmentId: estId }, isAvailable: true },
      });

      // Bookings this month (confirmed/completed) for occupancy
      const monthBookings = await prisma.booking.findMany({
        where: {
          establishmentId: estId,
          status: { in: ['confirmed', 'completed'] },
          OR: [
            { checkIn: { gte: monthStart, lte: monthEnd } },
            { checkOut: { gte: monthStart, lte: monthEnd } },
            { AND: [{ checkIn: { lte: monthStart } }, { checkOut: { gte: monthEnd } }] },
          ],
        },
        select: { checkIn: true, checkOut: true },
      });

      // Calculate occupied nights this month
      let occupiedNights = 0;
      for (const b of monthBookings) {
        const bStart = b.checkIn > monthStart ? b.checkIn : monthStart;
        const bEnd = b.checkOut && b.checkOut < monthEnd ? b.checkOut : monthEnd;
        const nights = Math.max(0, Math.ceil((bEnd.getTime() - bStart.getTime()) / (1000 * 60 * 60 * 24)));
        occupiedNights += nights;
      }
      const occupancyRate = totalRooms > 0 ? Math.round((occupiedNights / (totalRooms * daysInMonth)) * 10000) / 100 : 0;

      // Monthly revenue
      const monthlyRevenueResult = await prisma.booking.aggregate({
        where: {
          establishmentId: estId,
          status: { in: ['confirmed', 'completed'] },
          checkIn: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalPrice: true },
        _count: true,
      });

      const prevMonthRevenueResult = await prisma.booking.aggregate({
        where: {
          establishmentId: estId,
          status: { in: ['confirmed', 'completed'] },
          checkIn: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        _sum: { totalPrice: true },
        _count: true,
      });

      const monthlyRevenue = monthlyRevenueResult._sum.totalPrice || 0;
      const prevMonthRevenue = prevMonthRevenueResult._sum.totalPrice || 0;
      const monthlyRevenueChange = calcTrend(monthlyRevenue, prevMonthRevenue);
      const monthlyBookingsCount = monthlyRevenueResult._count;
      const monthlyBookingsChange = calcTrend(monthlyRevenueResult._count, prevMonthRevenueResult._count);

      // Average response time (confirmed bookings with confirmedAt)
      const confirmedWithTime = await prisma.booking.findMany({
        where: {
          establishmentId: estId,
          status: 'confirmed',
          confirmedAt: { not: null },
          createdAt: { gte: periodStart },
        },
        select: { createdAt: true, confirmedAt: true },
        take: 50,
      });

      let avgResponseTimeHours = 0;
      if (confirmedWithTime.length > 0) {
        const totalMs = confirmedWithTime.reduce((sum, b) => {
          return sum + (b.confirmedAt!.getTime() - b.createdAt.getTime());
        }, 0);
        avgResponseTimeHours = Math.round((totalMs / confirmedWithTime.length / (1000 * 60 * 60)) * 10) / 10;
      }

      // Today arrivals
      const todayArrivalsList = await prisma.booking.findMany({
        where: {
          establishmentId: estId,
          checkIn: { gte: todayStart, lte: todayEnd },
          status: { in: ['pending', 'confirmed'] },
        },
        select: {
          guestName: true,
          guestCount: true,
          reference: true,
          roomTypeId: true,
          checkIn: true,
          checkOut: true,
          status: true,
        },
        orderBy: { checkIn: 'asc' },
      });

      // Resolve room type names
      const roomTypeIds = todayArrivalsList.map(a => a.roomTypeId).filter(Boolean) as string[];
      const roomTypes = roomTypeIds.length > 0
        ? await prisma.roomType.findMany({
            where: { id: { in: roomTypeIds } },
            select: { id: true, name: true },
          })
        : [];
      const roomTypeMap = new Map(roomTypes.map(r => [r.id, r.name]));

      const todayArrivals = todayArrivalsList.map(a => ({
        guestName: a.guestName,
        guestCount: a.guestCount,
        reference: a.reference,
        roomTypeName: a.roomTypeId ? roomTypeMap.get(a.roomTypeId) || null : null,
        checkIn: a.checkIn.toISOString(),
        checkOut: a.checkOut?.toISOString() || null,
        status: a.status,
      }));

      // Pending list (last 5)
      const pendingBookingsList = await prisma.booking.findMany({
        where: {
          establishmentId: estId,
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          guestName: true,
          guestPhone: true,
          guestCount: true,
          checkIn: true,
          checkOut: true,
          reference: true,
          totalPrice: true,
          roomTypeId: true,
          createdAt: true,
        },
      });

      const pendingRoomTypeIds = pendingBookingsList.map(b => b.roomTypeId).filter(Boolean) as string[];
      const pendingRoomTypes = pendingRoomTypeIds.length > 0
        ? await prisma.roomType.findMany({
            where: { id: { in: pendingRoomTypeIds } },
            select: { id: true, name: true },
          })
        : [];
      const pendingRoomTypeMap = new Map(pendingRoomTypes.map(r => [r.id, r.name]));

      const pendingList = pendingBookingsList.map(b => ({
        id: b.id,
        guestName: b.guestName,
        guestPhone: b.guestPhone,
        guestCount: b.guestCount,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut?.toISOString() || null,
        reference: b.reference,
        totalPrice: b.totalPrice,
        roomTypeName: b.roomTypeId ? pendingRoomTypeMap.get(b.roomTypeId) || null : null,
        createdAt: b.createdAt.toISOString(),
      }));

      hotelStats = {
        occupancyRate,
        monthlyRevenue,
        monthlyRevenueChange: Math.round(monthlyRevenueChange * 100) / 100,
        monthlyBookingsCount,
        monthlyBookingsChange: Math.round(monthlyBookingsChange * 100) / 100,
        avgResponseTimeHours,
        todayArrivals,
        pendingList,
      };
    }

    // ---- Top Sources (group EstablishmentView by source) ----
    const SOURCE_LABELS: Record<string, string> = {
      search: 'Recherche',
      direct: 'Direct',
      map: 'Carte',
      featured: 'À la une',
    };

    let topSources: { source: string; count: number; percentage: number }[] = [];
    if (establishmentIds.length > 0) {
      const viewsBySource = await prisma.establishmentView.groupBy({
        by: ['source'],
        where: {
          establishmentId: { in: establishmentIds },
          createdAt: { gte: periodStart },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      const totalSourceViews = viewsBySource.reduce((sum, v) => sum + v._count.id, 0);
      topSources = viewsBySource.map(v => ({
        source: SOURCE_LABELS[v.source || ''] || 'Autres',
        count: v._count.id,
        percentage: totalSourceViews > 0 ? Math.round((v._count.id / totalSourceViews) * 100) : 0,
      }));
    }

    // ---- Weekly Views (daily view counts for the period) ----
    const weeklyViews: { date: string; views: number; clicks: number }[] = [];
    if (establishmentIds.length > 0) {
      const viewsRaw = await prisma.establishmentView.findMany({
        where: {
          establishmentId: { in: establishmentIds },
          createdAt: { gte: periodStart },
        },
        select: { createdAt: true },
      });

      const viewsByDay: Record<string, number> = {};
      for (const v of viewsRaw) {
        const dayKey = v.createdAt.toISOString().slice(0, 10);
        viewsByDay[dayKey] = (viewsByDay[dayKey] || 0) + 1;
      }

      for (let i = periodDays - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().slice(0, 10);
        weeklyViews.push({ date: key, views: viewsByDay[key] || 0, clicks: 0 });
      }
    }

    // ---- Monthly Revenue (last 6 months) ----
    const MONTHS_FR = ['jan.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
                       'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const monthlyRevenueArr: { month: string; revenue: number }[] = [];
    if (establishmentIds.length > 0) {
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const revenueRows = await prisma.booking.findMany({
        where: {
          establishmentId: { in: establishmentIds },
          status: { in: ['confirmed', 'completed'] },
          createdAt: { gte: sixMonthsAgo },
          totalPrice: { not: null },
        },
        select: { createdAt: true, totalPrice: true },
      });

      const revenueByMonth: Record<string, number> = {};
      for (const b of revenueRows) {
        const mKey = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth()).padStart(2, '0')}`;
        revenueByMonth[mKey] = (revenueByMonth[mKey] || 0) + (b.totalPrice || 0);
      }

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mKey = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
        monthlyRevenueArr.push({
          month: MONTHS_FR[d.getMonth()],
          revenue: revenueByMonth[mKey] || 0,
        });
      }
    }

    return apiSuccess({
      stats: {
        totalViews,
        totalBookings,
        totalRevenue,
        averageRating: Math.round(averageRating * 100) / 100,
        totalReviews,
        unreadMessages,
        todayBookings,
        pendingBookings,
        ctr: Math.round(ctr * 100) / 100,
        viewsTrend: Math.round(viewsTrend * 100) / 100,
        bookingsTrend: Math.round(bookingsTrend * 100) / 100,
        revenueTrend: Math.round(revenueTrend * 100) / 100,
        ratingTrend: Math.round(ratingTrend * 100) / 100,
        ...(hotelStats ? {
          occupancyRate: hotelStats.occupancyRate,
          monthlyRevenue: hotelStats.monthlyRevenue,
          monthlyRevenueChange: hotelStats.monthlyRevenueChange,
          monthlyBookingsCount: hotelStats.monthlyBookingsCount,
          monthlyBookingsChange: hotelStats.monthlyBookingsChange,
          avgResponseTimeHours: hotelStats.avgResponseTimeHours,
        } : {}),
      },
      recentBookings,
      recentReviews,
      weeklyViews,
      topSources,
      monthlyRevenue: monthlyRevenueArr,
      ...(hotelStats ? {
        todayArrivals: hotelStats.todayArrivals,
        pendingList: hotelStats.pendingList,
      } : {}),
    });
  } catch (error) {
    logger.error('Erreur recuperation stats dashboard:', error);
    return apiError('Erreur serveur', 500);
  }
}
