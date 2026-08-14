// Mada Spot — Billetterie : événement + types de billets disponibles (checkout).

import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET /api/ticketing/events/[slug]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const event = await prisma.event.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        startDate: true,
        endDate: true,
        location: true,
        city: true,
        coverImage: true,
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

    if (!event) return apiError('Événement introuvable', 404);

    const now = new Date();
    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        title: event.title,
        slug: event.slug,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.location,
        city: event.city,
        coverImage: event.coverImage,
        ticketTypes: event.ticketTypes.map((t) => ({
          id: t.id,
          name: t.name,
          priceMga: t.priceMga.toString(),
          remainingQuantity: t.remainingQuantity,
          maxPerOrder: t.maxPerOrder,
          soldOut: t.remainingQuantity <= 0,
          salesClosed: Boolean(t.salesEnd && t.salesEnd <= now),
        })),
      },
    });
  } catch (err) {
    logger.error('GET /api/ticketing/events/[slug] a échoué', err, 'ticketing.api');
    return apiError('Erreur serveur', 500);
  }
}
