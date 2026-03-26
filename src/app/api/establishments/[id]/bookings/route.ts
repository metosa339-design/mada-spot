import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth/middleware';
import { verifyCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';
// GET /api/establishments/[id]/bookings - Réservations pour le propriétaire
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  const { id } = await params;

  try {
    // Vérifier que l'utilisateur est le propriétaire (via claim approuvé) ou admin
    if (user.role !== 'ADMIN') {
      const ownerEst = await prisma.establishment.findFirst({
        where: { id, claimedByUserId: user.id },
      });
      if (!ownerEst) {
        return NextResponse.json({ error: 'Accès refusé. Vous devez être propriétaire de cet établissement.' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

    const where: any = { establishmentId: id };
    if (status && status !== 'all') where.status = status;

    const [bookings, total, stats] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.booking.count({ where }),
      Promise.all([
        prisma.booking.count({ where: { establishmentId: id, status: 'pending' } }),
        prisma.booking.count({ where: { establishmentId: id, status: 'confirmed' } }),
        prisma.booking.count({ where: { establishmentId: id, status: 'completed' } }),
      ]),
    ]);

    return NextResponse.json({
      success: true,
      bookings,
      total,
      stats: { pending: stats[0], confirmed: stats[1], completed: stats[2] },
    });
  } catch (error: unknown) {
    logger.error('[EST BOOKINGS] Error:', error);
    return apiError('Erreur serveur', 500);
  }
}

// PUT /api/establishments/[id]/bookings - Action propriétaire sur réservation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = request.headers.get('x-csrf-token');
  if (!csrf || !verifyCsrfToken(csrf)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  const { id } = await params;

  try {
    // Vérifier propriétaire
    if (user.role !== 'ADMIN') {
      const ownerEst = await prisma.establishment.findFirst({
        where: { id, claimedByUserId: user.id },
      });
      if (!ownerEst) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    }

    const _body = await request.json().catch(() => null);
    if (_body === null) return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    const { bookingId, action, reason } = _body;
    if (!bookingId || !action) {
      return NextResponse.json({ error: 'bookingId et action requis' }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, establishmentId: id },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }

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
        updateData.cancelReason = reason || 'Refusée par l\'établissement';
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
    return NextResponse.json({ success: true, booking: updated });
  } catch (error: unknown) {
    logger.error('[EST BOOKINGS] Action error:', error);
    return apiError('Erreur serveur', 500);
  }
}
