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
    const month = searchParams.get('month') // Format: YYYY-MM
    const establishmentId = searchParams.get('establishmentId')

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: 'Paramètre month requis au format YYYY-MM' },
        { status: 400 }
      )
    }

    // Get user's claimed establishments
    const establishments = await prisma.establishment.findMany({
      where: { claimedByUserId: user.id },
      select: { id: true, name: true, type: true },
    })

    if (establishments.length === 0) {
      return NextResponse.json({ availability: [], bookingCounts: {}, establishment: null })
    }

    // If establishmentId provided, verify it belongs to user
    let targetEstablishment = establishments[0]
    if (establishmentId) {
      const found = establishments.find(e => e.id === establishmentId)
      if (!found) {
        return NextResponse.json(
          { error: 'Établissement non trouvé ou non autorisé' },
          { status: 403 }
        )
      }
      targetEstablishment = found
    }

    // Parse month range
    const [year, m] = month.split('-').map(Number)
    const startDate = new Date(year, m - 1, 1)
    const endDate = new Date(year, m, 0, 23, 59, 59)

    // Fetch availability entries for the month
    const availability = await prisma.availability.findMany({
      where: {
        establishmentId: targetEstablishment.id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    })

    // Fetch booking counts per day for the month
    const bookings = await prisma.booking.findMany({
      where: {
        establishmentId: targetEstablishment.id,
        checkIn: { gte: startDate, lte: endDate },
      },
      select: { checkIn: true },
    })

    const bookingCounts = bookings.reduce((acc, b) => {
      const day = b.checkIn.toISOString().split('T')[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      availability: availability.map(a => ({
        id: a.id,
        date: a.date.toISOString(),
        isBlocked: a.isBlocked,
        roomsAvailable: a.roomsAvailable,
        tablesAvailable: a.tablesAvailable,
        spotsAvailable: a.spotsAvailable,
        note: a.note,
      })),
      bookingCounts,
      establishment: {
        id: targetEstablishment.id,
        name: targetEstablishment.name,
        type: targetEstablishment.type,
      },
    })
  } catch (error) {
    logger.error('Error fetching availability', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()
    const { establishmentId, date, isBlocked, roomsAvailable, tablesAvailable, spotsAvailable, note } = body

    if (!establishmentId || !date) {
      return NextResponse.json(
        { error: 'establishmentId et date sont requis' },
        { status: 400 }
      )
    }

    // Verify establishment belongs to user
    const establishment = await prisma.establishment.findFirst({
      where: { id: establishmentId, claimedByUserId: user.id },
      select: { id: true },
    })

    if (!establishment) {
      return NextResponse.json(
        { error: 'Établissement non trouvé ou non autorisé' },
        { status: 403 }
      )
    }

    const parsedDate = new Date(date)
    parsedDate.setHours(0, 0, 0, 0)

    // Upsert on the unique [establishmentId, date] constraint
    const availability = await prisma.availability.upsert({
      where: {
        establishmentId_date: {
          establishmentId: establishment.id,
          date: parsedDate,
        },
      },
      update: {
        isBlocked: isBlocked ?? false,
        roomsAvailable: roomsAvailable ?? null,
        tablesAvailable: tablesAvailable ?? null,
        spotsAvailable: spotsAvailable ?? null,
        note: note ?? null,
      },
      create: {
        establishmentId: establishment.id,
        date: parsedDate,
        isBlocked: isBlocked ?? false,
        roomsAvailable: roomsAvailable ?? null,
        tablesAvailable: tablesAvailable ?? null,
        spotsAvailable: spotsAvailable ?? null,
        note: note ?? null,
      },
    })

    return NextResponse.json({
      availability: {
        id: availability.id,
        date: availability.date.toISOString(),
        isBlocked: availability.isBlocked,
        roomsAvailable: availability.roomsAvailable,
        tablesAvailable: availability.tablesAvailable,
        spotsAvailable: availability.spotsAvailable,
        note: availability.note,
      },
    }, { status: 201 })
  } catch (error) {
    logger.error('Error saving availability', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()
    const { establishmentId, date } = body

    if (!establishmentId || !date) {
      return NextResponse.json(
        { error: 'establishmentId et date sont requis' },
        { status: 400 }
      )
    }

    // Verify establishment belongs to user
    const establishment = await prisma.establishment.findFirst({
      where: { id: establishmentId, claimedByUserId: user.id },
      select: { id: true },
    })

    if (!establishment) {
      return NextResponse.json(
        { error: 'Établissement non trouvé ou non autorisé' },
        { status: 403 }
      )
    }

    const parsedDate = new Date(date)
    parsedDate.setHours(0, 0, 0, 0)

    await prisma.availability.delete({
      where: {
        establishmentId_date: {
          establishmentId: establishment.id,
          date: parsedDate,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // Handle case where entry doesn't exist
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      return NextResponse.json(
        { error: 'Entrée de disponibilité non trouvée' },
        { status: 404 }
      )
    }
    logger.error('Error deleting availability', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
