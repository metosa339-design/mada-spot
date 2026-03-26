
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth';

import { logger } from '@/lib/logger';
// GET /api/establishments/my - Get all establishments owned by the current user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ success: false, error: 'Non autorisé' }, { status: 401 });

    const session = await verifySession(token);
    if (!session) return NextResponse.json({ success: false, error: 'Session invalide' }, { status: 401 });

    const establishments = await prisma.establishment.findMany({
      where: {
        isClaimed: true,
        claimedByUserId: session.id,
      },
      include: {
        hotel: { select: { starRating: true, hotelType: true } },
        restaurant: { select: { category: true, priceRange: true } },
        attraction: { select: { attractionType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, establishments });
  } catch (error) {
    logger.error('Error fetching my establishments:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
