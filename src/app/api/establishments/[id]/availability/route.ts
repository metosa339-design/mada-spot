import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Public endpoint — no auth required
// Returns blocked and occupied dates for the next 3 months
// Cache 5 minutes
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const establishment = await prisma.establishment.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!establishment) {
      return NextResponse.json({ error: 'Établissement introuvable' }, { status: 404 })
    }

    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59)

    // Blocked dates (provider manually blocked)
    const blockedAvailability = await prisma.availability.findMany({
      where: {
        establishmentId: id,
        date: { gte: startDate, lte: endDate },
        isBlocked: true,
      },
      select: { date: true },
    })

    const blockedDates = blockedAvailability.map(a => a.date.toISOString().split('T')[0])

    // Occupied dates (confirmed bookings only — pending still awaiting provider acceptance)
    const bookings = await prisma.booking.findMany({
      where: {
        establishmentId: id,
        status: 'confirmed',
        OR: [
          { checkIn: { gte: startDate, lte: endDate } },
          { checkOut: { gte: startDate, lte: endDate } },
          { AND: [{ checkIn: { lte: startDate } }, { checkOut: { gte: endDate } }] },
        ],
      },
      select: { checkIn: true, checkOut: true },
    })

    // Build set of occupied date strings
    const occupiedSet = new Set<string>()
    for (const b of bookings) {
      const bStart = b.checkIn > startDate ? b.checkIn : startDate
      const bEnd = b.checkOut && b.checkOut < endDate ? b.checkOut : endDate
      const current = new Date(bStart)
      while (current <= bEnd) {
        occupiedSet.add(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
      }
    }

    const occupiedDates = Array.from(occupiedSet)

    return NextResponse.json(
      { blockedDates, occupiedDates },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
