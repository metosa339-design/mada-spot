import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { logger } from '@/lib/logger';
import { apiError } from '@/lib/api-response';

// GET /api/bookings/reviewable - List completed bookings the user can review
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: 'completed',
      },
      include: {
        establishment: {
          select: {
            id: true,
            name: true,
            city: true,
            type: true,
            coverImage: true,
          },
        },
        review: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = bookings.map((booking) => ({
      id: booking.id,
      reference: booking.reference,
      bookingType: booking.bookingType,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guestCount: booking.guestCount,
      guestName: booking.guestName,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      status: booking.status,
      createdAt: booking.createdAt,
      establishment: booking.establishment,
      hasReview: !!booking.review,
    }));

    return NextResponse.json({ success: true, bookings: result });
  } catch (error) {
    logger.error('[BOOKINGS] Reviewable list error:', error);
    return apiError('Erreur serveur', 500);
  }
}
