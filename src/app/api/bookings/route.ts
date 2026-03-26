import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const db = prisma as any;
import { requireAuth } from '@/lib/auth/middleware';
import { verifyCsrfToken } from '@/lib/csrf';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { sendNotification } from '@/lib/email';

import { logger } from '@/lib/logger';
function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `BK-${code}`;
}

// POST /api/bookings - Créer une réservation
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, 'write');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  try {
    const data = await request.json().catch(() => null);
    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // CSRF verification (mandatory for authenticated write endpoint)
    if (!data.csrfToken || !verifyCsrfToken(data.csrfToken)) {
      return NextResponse.json({ error: 'Token CSRF invalide ou manquant' }, { status: 403 });
    }

    const {
      establishmentId,
      bookingType,
      checkIn,
      checkOut,
      guestCount,
      roomTypeId,
      specialRequests,
      guestName,
      guestEmail,
      guestPhone,
    } = data;

    if (!establishmentId || !bookingType || !checkIn || !guestName) {
      return NextResponse.json(
        { error: 'Champs requis : establishmentId, bookingType, checkIn, guestName' },
        { status: 400 }
      );
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    if (isNaN(checkInDate.getTime())) {
      return NextResponse.json({ error: 'Date de check-in invalide' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkInDate < today) {
      return NextResponse.json({ error: 'La date de check-in ne peut pas être dans le passé' }, { status: 400 });
    }

    if (checkOut) {
      const checkOutDate = new Date(checkOut);
      if (isNaN(checkOutDate.getTime())) {
        return NextResponse.json({ error: 'Date de check-out invalide' }, { status: 400 });
      }
      if (checkOutDate <= checkInDate) {
        return NextResponse.json({ error: 'La date de check-out doit être après le check-in' }, { status: 400 });
      }
    }

    // Vérifier que l'établissement existe et accepte les réservations
    const establishment = await db.establishment.findUnique({
      where: { id: establishmentId },
      include: { hotel: { include: { roomTypes: true } } },
    });

    if (!establishment || !establishment.isActive || establishment.moderationStatus !== 'approved') {
      return NextResponse.json({ error: 'Établissement introuvable ou non approuvé' }, { status: 404 });
    }

    // Role isolation: providers cannot book on other establishments
    if (user.userType) {
      return NextResponse.json(
        { error: 'Les prestataires ne peuvent pas effectuer de réservations. Utilisez un compte voyageur.' },
        { status: 403 }
      );
    }

    // Calculer prix si hôtel avec type de chambre
    let totalPrice: number | null = null;
    let currency = 'MGA';
    if (bookingType === 'hotel' && roomTypeId && checkOut) {
      const roomType = establishment.hotel?.roomTypes?.find((rt: any) => rt.id === roomTypeId);
      if (roomType && roomType.pricePerNight) {
        const nights = Math.max(1, Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
        ));
        totalPrice = roomType.pricePerNight * nights * (guestCount || 1);
      }
    }

    // Générer référence unique
    let reference = generateReference();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.booking.findUnique({ where: { reference } });
      if (!existing) break;
      reference = generateReference();
      attempts++;
    }

    const booking = await prisma.booking.create({
      data: {
        establishmentId,
        userId: user.id,
        bookingType,
        checkIn: new Date(checkIn),
        checkOut: checkOut ? new Date(checkOut) : null,
        guestCount: guestCount || 1,
        roomTypeId: roomTypeId || null,
        specialRequests: specialRequests || null,
        guestName,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        totalPrice,
        currency,
        reference,
        status: 'pending',
      },
      include: {
        establishment: { select: { name: true, city: true, type: true, claimedByUserId: true } },
      },
    });

    // Notification au prestataire (propriétaire de l'établissement)
    if (establishment.claimedByUserId) {
      const dateStr = new Date(checkIn).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      await prisma.notification.create({
        data: {
          userId: establishment.claimedByUserId,
          type: 'BOOKING_NEW' as any,
          title: 'Nouvelle réservation',
          message: `${guestName} a réservé chez ${booking.establishment.name} pour le ${dateStr} (${guestCount} pers.) — Réf: ${reference}`,
          entityType: 'booking',
          entityId: booking.id,
        },
      }).catch(() => {});
    }

    // Envoyer email de confirmation au client
    if (guestEmail) {
      sendNotification({
        to: guestEmail,
        type: 'booking_new',
        data: {
          reference,
          establishmentName: booking.establishment.name,
          checkIn: new Date(checkIn).toLocaleDateString('fr-FR'),
          checkOut: checkOut ? new Date(checkOut).toLocaleDateString('fr-FR') : null,
          guestCount: guestCount || 1,
          totalPrice,
          currency,
        },
        userId: user.id,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error: unknown) {
    logger.error('[BOOKINGS] Create error:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la réservation' }, { status: 500 });
  }
}

// GET /api/bookings - Lister mes réservations
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { user } = auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

  try {
    const where: any = { userId: user.id };
    if (status && status !== 'all') where.status = status;

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        include: {
          establishment: { select: { name: true, city: true, type: true, coverImage: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({ success: true, bookings, total });
  } catch (error: unknown) {
    logger.error('[BOOKINGS] List error:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des réservations' }, { status: 500 });
  }
}
