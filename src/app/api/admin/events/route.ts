import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { apiError } from '@/lib/api-response';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { logger } from '@/lib/logger';

// GET /api/admin/events - List all events (admin)
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) {
    return apiError('Non autorisé', 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const where: Record<string, unknown> = {};

    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: where as any,
        include: {
          establishment: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.event.count({ where: where as any }),
    ]);

    return NextResponse.json({ success: true, events, total });
  } catch (error) {
    logger.error('Error fetching admin events:', error);
    return apiError('Erreur serveur', 500);
  }
}
