// Mada Spot — POS : événements vendables au guichet (avec billets actifs).

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const POS_ROLES = ['POS_VENDOR', 'ADMIN'];

// GET /api/pos/events
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return apiError('Non autorisé', 401);
  if (!POS_ROLES.includes(user.role)) return apiError('Accès refusé', 403);

  try {
    const now = new Date();
    const events = await prisma.event.findMany({
      where: {
        ticketTypes: { some: { isActive: true } },
        OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: new Date(now.getTime() - 86400000) } }],
      },
      orderBy: { startDate: 'asc' },
      take: 100,
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        city: true,
        ticketTypes: {
          where: { isActive: true },
          orderBy: { priceMga: 'asc' },
          select: {
            id: true,
            name: true,
            priceMga: true,
            remainingQuantity: true,
            maxPerOrder: true,
            salesEnd: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: events.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        startDate: e.startDate,
        city: e.city,
        ticketTypes: e.ticketTypes.map((t) => ({
          id: t.id,
          name: t.name,
          priceMga: t.priceMga.toString(),
          remainingQuantity: t.remainingQuantity,
          maxPerOrder: t.maxPerOrder,
          soldOut: t.remainingQuantity <= 0,
          salesClosed: Boolean(t.salesEnd && t.salesEnd <= now),
        })),
      })),
    });
  } catch (err) {
    logger.error('GET /api/pos/events a échoué', err, 'pos.api');
    return apiError('Erreur serveur', 500);
  }
}
