// GET /api/admin/bookings/slow-providers — Liste des prestataires lents
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth/middleware';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Trouver les établissements avec des bookings expirés ou fortement relancés
    const slowEstablishments = await prisma.booking.groupBy({
      by: ['establishmentId'],
      where: {
        createdAt: { gte: since },
        OR: [
          { expiredAt: { not: null } },
          { relanceCount: { gte: 1 } },
        ],
      },
      _count: { id: true },
      _max: { createdAt: true },
      _sum: { relanceCount: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
      skip: offset,
    });

    // Compter le total de bookings expirés par établissement
    const expiredCounts = await prisma.booking.groupBy({
      by: ['establishmentId'],
      where: {
        createdAt: { gte: since },
        expiredAt: { not: null },
      },
      _count: { id: true },
    });

    const expiredMap = new Map(expiredCounts.map((e) => [e.establishmentId, e._count.id]));

    // Récupérer les détails des établissements
    const establishmentIds = slowEstablishments.map((s) => s.establishmentId);
    const establishments = await prisma.establishment.findMany({
      where: { id: { in: establishmentIds } },
      select: {
        id: true,
        name: true,
        city: true,
        type: true,
        phone: true,
        email: true,
        claimedByUserId: true,
      },
    });

    // Récupérer les owners
    const ownerIds = establishments.map((e) => e.claimedByUserId).filter(Boolean) as string[];
    const owners = await prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
    });
    const ownerMap = new Map(owners.map((o) => [o.id, o]));

    const estMap = new Map(establishments.map((e) => [e.id, e]));

    // Pending bookings count par établissement
    const pendingCounts = await prisma.booking.groupBy({
      by: ['establishmentId'],
      where: {
        establishmentId: { in: establishmentIds },
        status: 'pending',
      },
      _count: { id: true },
    });
    const pendingMap = new Map(pendingCounts.map((p) => [p.establishmentId, p._count.id]));

    // Construire la réponse
    const providers = slowEstablishments.map((s) => {
      const est = estMap.get(s.establishmentId);
      const owner = est?.claimedByUserId ? ownerMap.get(est.claimedByUserId) : null;
      const expiredCount = expiredMap.get(s.establishmentId) || 0;
      const pendingCount = pendingMap.get(s.establishmentId) || 0;

      return {
        establishmentId: s.establishmentId,
        establishmentName: est?.name || 'Inconnu',
        city: est?.city || '',
        type: est?.type || '',
        phone: est?.phone || owner?.phone || null,
        email: est?.email || owner?.email || null,
        ownerName: owner ? `${owner.firstName} ${owner.lastName}` : null,
        totalRelanced: s._count.id,
        totalExpired: expiredCount,
        totalRelancesSent: s._sum.relanceCount || 0,
        pendingBookings: pendingCount,
        lastBookingDate: s._max.createdAt,
        severity: expiredCount >= 3 ? 'critical' : expiredCount >= 1 ? 'warning' : 'info',
      };
    });

    // Stats globales
    const totalSlowProviders = providers.length;
    const totalExpired = providers.reduce((sum, p) => sum + p.totalExpired, 0);
    const totalPending = providers.reduce((sum, p) => sum + p.pendingBookings, 0);

    return NextResponse.json({
      success: true,
      providers,
      stats: {
        totalSlowProviders,
        totalExpired,
        totalPending,
        period: `${days} jours`,
      },
      pagination: { limit, offset, total: totalSlowProviders },
    });
  } catch (error) {
    logger.error('Erreur slow-providers:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
