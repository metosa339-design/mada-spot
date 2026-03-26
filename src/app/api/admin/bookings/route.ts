import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError } from '@/lib/api-response';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { logAudit, getRequestMeta } from '@/lib/audit';


import { logger } from '@/lib/logger';
// GET /api/admin/bookings - Lister toutes les réservations
export async function GET(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  const { searchParams } = new URL(request.url);
  const VALID_BOOKING_STATUSES = ['all', 'pending', 'confirmed', 'cancelled', 'completed'];
  const VALID_BOOKING_TYPES = ['all', 'HOTEL', 'RESTAURANT', 'ATTRACTION'];

  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

  try {
    const where: any = {};
    if (status && status !== 'all' && VALID_BOOKING_STATUSES.includes(status)) where.status = status;
    if (type && type !== 'all' && VALID_BOOKING_TYPES.includes(type)) where.bookingType = type;

    const [bookings, total, stats] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          establishment: { select: { name: true, city: true, type: true } },
          user: { select: { id: true, email: true, phone: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.booking.count({ where }),
      Promise.all([
        prisma.booking.count({ where: { status: 'pending' } }),
        prisma.booking.count({ where: { status: 'confirmed' } }),
        prisma.booking.count({ where: { status: 'cancelled' } }),
        prisma.booking.count({ where: { status: 'completed' } }),
        prisma.booking.count(),
      ]),
    ]);

    return NextResponse.json({
      success: true,
      bookings,
      total,
      stats: {
        pending: stats[0],
        confirmed: stats[1],
        cancelled: stats[2],
        completed: stats[3],
        total: stats[4],
      },
    });
  } catch (error: unknown) {
    logger.error('[ADMIN BOOKINGS] List error:', error);
    return apiError('Erreur serveur', 500);
  }
}

// PUT /api/admin/bookings - Action admin sur une réservation
export async function PUT(request: NextRequest) {
  const user = await checkAdminAuth(request);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const _body = await request.json().catch(() => null);
    if (_body === null) return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    const { bookingId, action, reason } = _body;

    if (!bookingId || !action) {
      return NextResponse.json({ error: 'bookingId et action requis' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });

    const updateData: any = {};
    switch (action) {
      case 'confirm':
        updateData.status = 'confirmed';
        updateData.confirmedAt = new Date();
        updateData.confirmedBy = user.id;
        break;
      case 'cancel':
        updateData.status = 'cancelled';
        updateData.cancelledAt = new Date();
        updateData.cancelReason = reason || 'Annulée par admin';
        break;
      case 'complete':
        updateData.status = 'completed';
        break;
      case 'no_show':
        updateData.status = 'no_show';
        break;
      default:
        return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const updated = await prisma.booking.update({ where: { id: bookingId }, data: updateData });

    // Audit log
    const meta = getRequestMeta(request);
    logAudit({ userId: user.id, action, entityType: 'booking', entityId: bookingId, details: { action, reason }, ...meta });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: unknown) {
    logger.error('[ADMIN BOOKINGS] Action error:', error);
    return apiError('Erreur serveur', 500);
  }
}
