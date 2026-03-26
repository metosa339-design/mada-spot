import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Paramètre month requis (YYYY-MM)' }, { status: 400 })
    }

    // Get user's establishment (hotel)
    const establishment = await prisma.establishment.findFirst({
      where: { claimedByUserId: user.id },
      select: { id: true, name: true, type: true },
    })

    if (!establishment) {
      return NextResponse.json({ roomTypes: [], bookings: [], blockedDates: {}, establishment: null })
    }

    // Fetch room types for hotel (RoomType → Hotel → Establishment)
    const roomTypes = establishment.type === 'HOTEL'
      ? await prisma.roomType.findMany({
          where: { hotel: { establishmentId: establishment.id } },
          select: { id: true, name: true, capacity: true, pricePerNight: true, isAvailable: true },
          orderBy: { pricePerNight: 'desc' },
        })
      : []

    // Parse month range
    const [year, m] = month.split('-').map(Number)
    const startDate = new Date(year, m - 1, 1)
    const endDate = new Date(year, m, 0, 23, 59, 59)

    // Fetch bookings for the month
    const bookings = await prisma.booking.findMany({
      where: {
        establishmentId: establishment.id,
        OR: [
          { checkIn: { gte: startDate, lte: endDate } },
          { checkOut: { gte: startDate, lte: endDate } },
          {
            AND: [
              { checkIn: { lte: startDate } },
              { checkOut: { gte: endDate } },
            ],
          },
        ],
        status: { in: ['pending', 'confirmed', 'completed'] },
      },
      select: {
        id: true,
        reference: true,
        guestName: true,
        guestPhone: true,
        guestCount: true,
        checkIn: true,
        checkOut: true,
        status: true,
        totalPrice: true,
        bookingType: true,
        roomTypeId: true,
      },
      orderBy: { checkIn: 'asc' },
    })

    // Fetch blocked dates (availability entries)
    const availability = await prisma.availability.findMany({
      where: {
        establishmentId: establishment.id,
        date: { gte: startDate, lte: endDate },
        isBlocked: true,
      },
      select: { date: true, note: true },
    })

    const blockedDates: Record<string, string | null> = {}
    for (const a of availability) {
      blockedDates[a.date.toISOString().split('T')[0]] = a.note
    }

    return NextResponse.json({
      establishment: {
        id: establishment.id,
        name: establishment.name,
        type: establishment.type,
      },
      roomTypes: roomTypes.map(r => ({
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        pricePerNight: r.pricePerNight,
        isAvailable: r.isAvailable,
      })),
      bookings: bookings.map(b => ({
        id: b.id,
        reference: b.reference,
        guestName: b.guestName,
        guestPhone: b.guestPhone,
        guestCount: b.guestCount,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut?.toISOString() || null,
        status: b.status,
        totalPrice: b.totalPrice,
        bookingType: b.bookingType,
        roomTypeId: b.roomTypeId,
      })),
      blockedDates,
    })
  } catch (error) {
    logger.error('Error fetching calendar data', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
