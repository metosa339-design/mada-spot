import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';

import { logger } from '@/lib/logger';
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const publications = await prisma.establishment.findMany({
      where: {
        OR: [
          { claimedByUserId: user.id, dataSource: 'user_contribution' },
          { createdByUserId: user.id, isGhost: true },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        coverImage: true,
        city: true,
        region: true,
        rating: true,
        reviewCount: true,
        isGhost: true,
        moderationStatus: true,
        moderationNote: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, publications });
  } catch (error) {
    logger.error('Erreur publications client:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
