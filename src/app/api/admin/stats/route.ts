import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { AdminStatsResponse } from '@/types/admin-dashboard';

// GET /api/admin/stats - Dashboard KPIs and charts (non-financial)
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';

  // Calculate period boundaries
  const periodDays = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const trend = (current: number, previous: number) =>
    Math.round(((current - previous) / (previous || 1)) * 100);

  try {
    const [
      // Users
      totalUsers,
      newUsers,
      previousNewUsers,
      // Establishments
      totalEstablishments,
      newEstablishments,
      previousNewEstablishments,
      establishmentBreakdown,
      // Bookings
      totalBookings,
      newBookings,
      previousNewBookings,
      // Messages
      totalMessages,
      newMessages,
      previousNewMessages,
      // Views
      totalViews,
      newViews,
      previousNewViews,
      // Reviews
      totalReviews,
      newReviews,
      previousNewReviews,
      averageRatingResult,
      // Moderation
      pendingEstablishments,
      pendingClaims,
      flaggedReviews,
      pendingBookings,
      // Charts - raw data
      userGrowthRaw,
      bookingTrendRaw,
      userGrowthByTypeRaw,
      messageTrendRaw,
      // Top establishments
      topEstablishmentsRaw,
      // Activity
      recentActivityRaw,
    ] = await Promise.all([
      // --- Users ---
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.user.count({ where: { createdAt: { gte: previousPeriodStart, lt: periodStart } } }),

      // --- Establishments ---
      prisma.establishment.count(),
      prisma.establishment.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.establishment.count({ where: { createdAt: { gte: previousPeriodStart, lt: periodStart } } }),
      prisma.establishment.groupBy({ by: ['type'], _count: true }),

      // --- Bookings ---
      prisma.booking.count(),
      prisma.booking.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.booking.count({ where: { createdAt: { gte: previousPeriodStart, lt: periodStart } } }),

      // --- Messages ---
      prisma.message.count(),
      prisma.message.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.message.count({ where: { createdAt: { gte: previousPeriodStart, lt: periodStart } } }),

      // --- Views ---
      prisma.establishmentView.count(),
      prisma.establishmentView.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.establishmentView.count({ where: { createdAt: { gte: previousPeriodStart, lt: periodStart } } }),

      // --- Reviews ---
      prisma.establishmentReview.count(),
      prisma.establishmentReview.count({ where: { createdAt: { gte: periodStart } } }),
      prisma.establishmentReview.count({ where: { createdAt: { gte: previousPeriodStart, lt: periodStart } } }),
      prisma.establishmentReview.aggregate({ _avg: { rating: true } }),

      // --- Moderation ---
      prisma.establishment.count({ where: { moderationStatus: 'pending_review' } }),
      prisma.establishmentClaim.count({ where: { status: 'PENDING' } }),
      prisma.establishmentReview.count({ where: { isFlagged: true } }),
      prisma.booking.count({ where: { status: 'pending' } }),

      // --- Charts: user growth (last 30 days) ---
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),

      // --- Charts: booking trend (last 30 days) ---
      prisma.booking.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),

      // --- Charts: user growth by type (last 30 days) ---
      prisma.user.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true, role: true, userType: true },
      }),

      // --- Charts: message trend (last 30 days) ---
      prisma.message.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { createdAt: true },
      }),

      // --- Top 5 establishments by viewCount ---
      prisma.establishment.findMany({
        where: { isActive: true },
        orderBy: { viewCount: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          viewCount: true,
          rating: true,
          _count: { select: { bookings: true } },
        },
      }),

      // --- Last 10 audit logs ---
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          details: true,
          createdAt: true,
        },
      }),
    ]);

    // --- Group user growth by date ---
    const userGrowthMap = new Map<string, number>();
    for (const u of userGrowthRaw) {
      const day = u.createdAt.toISOString().slice(0, 10);
      userGrowthMap.set(day, (userGrowthMap.get(day) || 0) + 1);
    }
    const userGrowth = Array.from(userGrowthMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Group booking trend by date ---
    const bookingTrendMap = new Map<string, number>();
    for (const b of bookingTrendRaw) {
      const day = b.createdAt.toISOString().slice(0, 10);
      bookingTrendMap.set(day, (bookingTrendMap.get(day) || 0) + 1);
    }
    const bookingTrend = Array.from(bookingTrendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Group user growth by type and date ---
    const userByTypeMap = new Map<string, { CLIENT: number; HOTEL: number; RESTAURANT: number; ATTRACTION: number; PROVIDER: number }>();
    for (const u of userGrowthByTypeRaw) {
      const day = u.createdAt.toISOString().slice(0, 10);
      if (!userByTypeMap.has(day)) {
        userByTypeMap.set(day, { CLIENT: 0, HOTEL: 0, RESTAURANT: 0, ATTRACTION: 0, PROVIDER: 0 });
      }
      const entry = userByTypeMap.get(day)!;
      if (u.role === 'CLIENT') {
        entry.CLIENT++;
      } else if (u.userType) {
        const key = u.userType as keyof typeof entry;
        if (key in entry && key !== 'CLIENT') entry[key]++;
      }
    }
    const userGrowthByType = Array.from(userByTypeMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Group message trend by date ---
    const messageTrendMap = new Map<string, number>();
    for (const m of messageTrendRaw) {
      const day = m.createdAt.toISOString().slice(0, 10);
      messageTrendMap.set(day, (messageTrendMap.get(day) || 0) + 1);
    }
    const messageTrend = Array.from(messageTrendMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // --- Format top establishments ---
    const topEstablishments = topEstablishmentsRaw.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      city: e.city,
      viewCount: e.viewCount,
      rating: e.rating,
      bookingCount: e._count.bookings,
    }));

    // --- Format recent activity ---
    const recentActivity = recentActivityRaw.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      createdAt: log.createdAt.toISOString(),
    }));

    // --- Build response ---
    const moderationTotal = pendingEstablishments + pendingClaims + flaggedReviews + pendingBookings;

    const data: AdminStatsResponse = {
      kpis: {
        totalUsers,
        newUsers,
        usersTrend: trend(newUsers, previousNewUsers),
        totalEstablishments,
        newEstablishments,
        establishmentsTrend: trend(newEstablishments, previousNewEstablishments),
        totalBookings,
        newBookings,
        bookingsTrend: trend(newBookings, previousNewBookings),
        totalMessages,
        newMessages,
        messagesTrend: trend(newMessages, previousNewMessages),
        totalViews,
        newViews,
        viewsTrend: trend(newViews, previousNewViews),
        totalReviews,
        newReviews,
        reviewsTrend: trend(newReviews, previousNewReviews),
        averageRating: Math.round((averageRatingResult._avg.rating || 0) * 10) / 10,
      },
      establishmentBreakdown: establishmentBreakdown.map((g) => ({
        type: g.type as 'HOTEL' | 'RESTAURANT' | 'ATTRACTION' | 'PROVIDER',
        count: g._count,
      })),
      moderationQueue: {
        pendingEstablishments,
        pendingClaims,
        flaggedReviews,
        pendingBookings,
        total: moderationTotal,
      },
      charts: {
        userGrowth,
        bookingTrend,
        userGrowthByType,
        messageTrend,
      },
      topEstablishments,
      recentActivity,
    };

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    logger.error('[ADMIN STATS] Error:', error);
    return apiError('Erreur serveur', 500);
  }
}
