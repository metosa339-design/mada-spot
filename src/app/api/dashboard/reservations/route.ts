import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const month = searchParams.get('month') // Format: YYYY-MM
    const tab = searchParams.get('tab') // 'today' | 'pending' | 'confirmed'

    // Get user's establishments
    const establishments = await prisma.establishment.findMany({
      where: { claimedByUserId: user.id },
      select: { id: true },
    })
    const establishmentIds = establishments.map(e => e.id)

    if (establishmentIds.length === 0) {
      return NextResponse.json({ bookings: [], calendarData: {} })
    }

    // Build where clause
    const where: Record<string, unknown> = {
      establishmentId: { in: establishmentIds },
    }

    if (tab === 'today') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      where.checkIn = { gte: today, lt: tomorrow }
    } else if (status) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        establishment: {
          select: { name: true, type: true },
        },
      },
      orderBy: { checkIn: 'desc' },
      take: 50,
    })

    // Calendar data for the month
    let calendarData: Record<string, number> = {}
    if (month) {
      const [year, m] = month.split('-').map(Number)
      const startDate = new Date(year, m - 1, 1)
      const endDate = new Date(year, m, 0, 23, 59, 59)

      const monthBookings = await prisma.booking.findMany({
        where: {
          establishmentId: { in: establishmentIds },
          checkIn: { gte: startDate, lte: endDate },
        },
        select: { checkIn: true },
      })

      calendarData = monthBookings.reduce((acc, b) => {
        const day = b.checkIn.toISOString().split('T')[0]
        acc[day] = (acc[day] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      bookings: bookings.map(b => ({
        id: b.id,
        reference: b.reference,
        guestName: b.guestName,
        guestPhone: b.guestPhone,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut?.toISOString() || null,
        guestCount: b.guestCount,
        status: b.status,
        totalPrice: b.totalPrice,
        bookingType: b.bookingType,
        establishment: b.establishment,
        createdAt: b.createdAt.toISOString(),
      })),
      calendarData,
    })
  } catch (error) {
    logger.error('Error fetching reservations', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST — Provider creates a booking manually (walk-in, phone call, etc.)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const body = await request.json()
    const { guestName, guestPhone, guestCount, checkIn, checkOut, roomTypeId, specialRequests } = body

    if (!guestName || !checkIn) {
      return NextResponse.json({ error: 'Nom et date d\'arrivée requis' }, { status: 400 })
    }

    // Get provider's establishment
    const establishment = await prisma.establishment.findFirst({
      where: { claimedByUserId: user.id },
      select: { id: true, type: true },
    })

    if (!establishment) {
      return NextResponse.json({ error: 'Aucun établissement trouvé' }, { status: 404 })
    }

    // Generate unique reference
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let ref = ''
    for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)]
    const reference = `BK-${ref}`

    // Determine booking type from establishment type
    const bookingType = establishment.type === 'HOTEL' ? 'hotel'
      : establishment.type === 'RESTAURANT' ? 'restaurant'
      : 'attraction'

    const booking = await prisma.booking.create({
      data: {
        establishmentId: establishment.id,
        userId: user.id,
        bookingType,
        guestName,
        guestPhone: guestPhone || null,
        guestCount: guestCount || 1,
        checkIn: new Date(checkIn),
        checkOut: checkOut ? new Date(checkOut) : null,
        roomTypeId: roomTypeId || null,
        specialRequests: specialRequests || null,
        reference,
        status: 'confirmed',
        confirmedAt: new Date(),
        confirmedBy: user.id,
      },
    })

    return NextResponse.json({
      booking: {
        id: booking.id,
        reference: booking.reference,
        guestName: booking.guestName,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut?.toISOString() || null,
        status: booking.status,
      },
    })
  } catch (error) {
    logger.error('Error creating reservation', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const body = await request.json()
    const { bookingId, status, proposedDate, proposedCheckOut } = body
    if (!bookingId || !status) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Verify ownership
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        establishment: { select: { claimedByUserId: true, name: true } },
        user: { select: { id: true, email: true, firstName: true } },
      },
    })

    if (!booking || booking.establishment.claimedByUserId !== user.id) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { status }
    let notifTitle = ''
    let notifMessage = ''
    let notifType = 'BOOKING_CONFIRMED'

    if (status === 'confirmed') {
      updateData.confirmedAt = new Date()
      updateData.confirmedBy = user.id
      notifTitle = 'Réservation confirmée'
      notifMessage = `Votre réservation ${booking.reference} chez ${booking.establishment.name} a été confirmée.`
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date()
      notifType = 'BOOKING_CANCELLED'
      notifTitle = 'Réservation refusée'
      notifMessage = `Votre réservation ${booking.reference} chez ${booking.establishment.name} a été refusée.`
    } else if (status === 'rescheduled' && proposedDate) {
      // Provider proposes a new date
      updateData.status = 'pending'
      updateData.checkIn = new Date(proposedDate)
      if (proposedCheckOut) {
        updateData.checkOut = new Date(proposedCheckOut)
      }
      notifType = 'BOOKING_CONFIRMED'
      notifTitle = 'Nouvelle date proposée'
      const dateStr = new Date(proposedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      notifMessage = `Une nouvelle date a été proposée pour votre réservation ${booking.reference} : ${dateStr}. Veuillez confirmer.`
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    })

    // Notification
    await prisma.notification.create({
      data: {
        userId: booking.userId,
        type: notifType as any,
        title: notifTitle,
        message: notifMessage,
        entityType: 'booking',
        entityId: bookingId,
      },
    })

    // Auto-email for status changes
    if (booking.user.email && (status === 'confirmed' || status === 'cancelled')) {
      const { sendNotification } = await import('@/lib/email')
      sendNotification({
        to: booking.user.email,
        type: status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
        data: {
          reference: booking.reference,
          establishmentName: booking.establishment.name,
          checkIn: booking.checkIn.toLocaleDateString('fr-FR'),
          checkOut: booking.checkOut?.toLocaleDateString('fr-FR'),
          guestCount: booking.guestCount,
        },
        userId: booking.userId,
      }).catch(() => {})
    }

    return NextResponse.json({
      booking: {
        id: updated.id,
        status: updated.status,
        checkIn: updated.checkIn.toISOString(),
        checkOut: updated.checkOut?.toISOString() || null,
      },
    })
  } catch (error) {
    logger.error('Error updating reservation', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
