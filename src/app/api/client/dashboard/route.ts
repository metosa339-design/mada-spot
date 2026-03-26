import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return apiError('Non authentifié', 401);
    }

    const sessionUser = await verifySession(token);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    if (sessionUser.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Accès réservé aux clients' }, { status: 403 });
    }

    const now = new Date();

    // Parallel queries for all stats
    const [
      favoritesCount,
      publicationsCount,
      reviewsCount,
      upcomingBookingsCount,
      completedBookingsCount,
      totalBookingsCount,
      unreadMessagesCount,
      nextBooking,
      recentFavorites,
      categoryCountsRaw,
    ] = await Promise.all([
      // Favorites count
      prisma.establishmentFavorite.count({
        where: { userId: sessionUser.id },
      }),
      // Publications count
      prisma.establishment.count({
        where: {
          claimedByUserId: sessionUser.id,
          dataSource: 'user_contribution',
        },
      }),
      // Reviews count (contributions)
      prisma.establishmentReview.count({
        where: { userId: sessionUser.id },
      }),
      // Upcoming bookings (confirmed, check-in in future)
      prisma.booking.count({
        where: {
          userId: sessionUser.id,
          status: { in: ['confirmed', 'pending'] },
          checkIn: { gte: now },
        },
      }),
      // Completed bookings
      prisma.booking.count({
        where: {
          userId: sessionUser.id,
          status: 'completed',
        },
      }),
      // Total bookings
      prisma.booking.count({
        where: { userId: sessionUser.id },
      }),
      // Unread messages
      prisma.message.count({
        where: {
          receiverId: sessionUser.id,
          isRead: false,
        },
      }),
      // Next upcoming booking with establishment details
      prisma.booking.findFirst({
        where: {
          userId: sessionUser.id,
          status: { in: ['confirmed', 'pending'] },
          checkIn: { gte: now },
        },
        orderBy: { checkIn: 'asc' },
        select: {
          id: true,
          reference: true,
          bookingType: true,
          checkIn: true,
          checkOut: true,
          guestCount: true,
          guestName: true,
          status: true,
          totalPrice: true,
          currency: true,
          establishment: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              region: true,
              type: true,
              coverImage: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      }),
      // Recent favorites (last 5)
      prisma.establishmentFavorite.findMany({
        where: { userId: sessionUser.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          establishment: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              city: true,
              coverImage: true,
              rating: true,
            },
          },
        },
      }),
      // Category counts (active, approved establishments)
      prisma.establishment.groupBy({
        by: ['type'],
        where: {
          isActive: true,
          moderationStatus: 'approved',
        },
        _count: { id: true },
      }),
    ]);

    // Transform category counts
    const categoryCounts: Record<string, number> = {};
    for (const row of categoryCountsRaw) {
      categoryCounts[row.type] = row._count.id;
    }

    // Loyalty points from DB
    const userRecord = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { loyaltyPoints: true },
    });
    const loyaltyPoints = Math.max(0, userRecord?.loyaltyPoints ?? 0);

    return NextResponse.json({
      stats: {
        favorites: favoritesCount,
        publications: publicationsCount,
        reviews: reviewsCount,
        upcomingBookings: upcomingBookingsCount,
        completedBookings: completedBookingsCount,
        totalBookings: totalBookingsCount,
        unreadMessages: unreadMessagesCount,
        loyaltyPoints,
      },
      nextBooking: nextBooking
        ? {
            id: nextBooking.id,
            reference: nextBooking.reference,
            bookingType: nextBooking.bookingType,
            checkIn: nextBooking.checkIn.toISOString(),
            checkOut: nextBooking.checkOut?.toISOString() || null,
            guestCount: nextBooking.guestCount,
            guestName: nextBooking.guestName,
            status: nextBooking.status,
            totalPrice: nextBooking.totalPrice,
            currency: nextBooking.currency,
            establishment: nextBooking.establishment,
          }
        : null,
      recentFavorites: recentFavorites.map((f) => ({
        id: f.id,
        establishment: f.establishment,
      })),
      categoryCounts,
    });
  } catch (error) {
    logger.error('Erreur dashboard client:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
