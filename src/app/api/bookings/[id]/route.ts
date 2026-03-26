import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { requireAuth } from '@/lib/auth/middleware';
import { verifyCsrfToken } from '@/lib/csrf';
import { sendNotification } from '@/lib/email';

import { logger } from '@/lib/logger';
import { awardLoyaltyPoints, LOYALTY_POINTS } from '@/lib/loyalty';
// GET /api/bookings/[id] - Détail d'une réservation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  const { id } = await params;

  try {
    const booking = await db.booking.findUnique({
      where: { id },
      include: {
        establishment: {
          select: { name: true, city: true, type: true, coverImage: true, phone: true, email: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }

    // Vérifier que c'est bien l'utilisateur ou le propriétaire
    if (booking.userId !== user.id && user.role !== 'ADMIN') {
      // Vérifier si l'utilisateur est le propriétaire de l'établissement
      const establishment = await prisma.establishment.findFirst({
        where: { id: booking.establishmentId, claimedByUserId: user.id },
      });
      if (!establishment) {
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: unknown) {
    logger.error('[BOOKINGS] Get error:', error);
    return apiError('Erreur serveur', 500);
  }
}

// PUT /api/bookings/[id] - Mettre à jour le statut d'une réservation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;
  const { id } = await params;

  try {
    const data = await request.json().catch(() => null);
    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // CSRF verification (mandatory for authenticated write endpoint)
    if (!data.csrfToken || !verifyCsrfToken(data.csrfToken)) {
      return NextResponse.json({ error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    const { action } = data; // "confirm", "cancel", "complete", "no_show"

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });
    }

    // Permissions : le client peut annuler, le propriétaire/admin peut tout faire
    const isOwner = booking.userId === user.id;
    const isAdmin = user.role === 'ADMIN';
    const ownerEst = await prisma.establishment.findFirst({
      where: { id: booking.establishmentId, claimedByUserId: user.id },
    });
    const isEstablishmentOwner = !!ownerEst;

    if (!isOwner && !isAdmin && !isEstablishmentOwner) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Seul le client peut annuler ses propres réservations
    if (action === 'cancel' && isOwner) {
      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelReason: data.reason || 'Annulée par le client',
        },
      });
      return NextResponse.json({ success: true, booking: updated });
    }

    // Propriétaire ou admin peut confirmer/compléter/no_show/annuler
    if (isEstablishmentOwner || isAdmin) {
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
          updateData.cancelReason = data.reason || 'Annulée par le gestionnaire';
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

      const updated = await prisma.booking.update({
        where: { id },
        data: updateData,
        include: { establishment: { select: { name: true } } },
      });

      // Award loyalty points on booking completion
      if (action === 'complete' && booking.userId) {
        awardLoyaltyPoints({
          userId: booking.userId,
          type: 'BOOKING_COMPLETE',
          points: LOYALTY_POINTS.BOOKING_COMPLETE,
          description: `Réservation terminée — ${(updated as any).establishment?.name || 'Établissement'}`,
          entityId: booking.id,
        }).catch(() => {});
      }

      // Envoyer notification email au client
      if (booking.guestEmail && (action === 'confirm' || action === 'cancel')) {
        const emailType = action === 'confirm' ? 'booking_confirmed' : 'booking_cancelled';
        sendNotification({
          to: booking.guestEmail,
          type: emailType as any,
          data: {
            reference: booking.reference,
            establishmentName: (updated as any).establishment?.name || '',
            checkIn: booking.checkIn.toLocaleDateString?.('fr-FR') || '',
            checkOut: booking.checkOut?.toLocaleDateString?.('fr-FR') || null,
            guestCount: booking.guestCount,
            reason: updateData.cancelReason,
          },
          userId: booking.userId,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, booking: updated });
    }

    return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 });
  } catch (error: unknown) {
    logger.error('[BOOKINGS] Update error:', error);
    return apiError('Erreur serveur', 500);
  }
}
