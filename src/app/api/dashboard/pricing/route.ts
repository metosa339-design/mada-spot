import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const establishments = await prisma.establishment.findMany({
      where: { claimedByUserId: user.id },
      select: {
        id: true,
        name: true,
        type: true,
        hotel: {
          select: {
            roomTypes: {
              select: { name: true, pricePerNight: true, priceWeekend: true },
            },
          },
        },
        restaurant: {
          select: { avgMainCourse: true, avgBeer: true, priceRange: true },
        },
        attraction: {
          select: { isFree: true, entryFeeForeign: true, entryFeeLocal: true },
        },
        provider: {
          select: { priceFrom: true, priceTo: true, priceUnit: true, priceRange: true },
        },
      },
    })
    const establishmentIds = establishments.map(e => e.id)

    if (establishmentIds.length === 0) {
      return NextResponse.json({ seasons: [], establishments: [] })
    }

    const seasons = await prisma.seasonalPricing.findMany({
      where: { establishmentId: { in: establishmentIds } },
      orderBy: { startDate: 'asc' },
    })

    // Build prices list per establishment
    const establishmentPrices = establishments.map(e => {
      const prices: { label: string; value: number }[] = []

      if (e.type === 'HOTEL' && e.hotel?.roomTypes) {
        for (const room of e.hotel.roomTypes) {
          prices.push({ label: `${room.name} / nuit`, value: room.pricePerNight })
          if (room.priceWeekend) {
            prices.push({ label: `${room.name} / weekend`, value: room.priceWeekend })
          }
        }
      }
      if (e.type === 'RESTAURANT' && e.restaurant) {
        if (e.restaurant.avgMainCourse) {
          prices.push({ label: 'Plat principal (moy.)', value: e.restaurant.avgMainCourse })
        }
        if (e.restaurant.avgBeer) {
          prices.push({ label: 'Bière (moy.)', value: e.restaurant.avgBeer })
        }
      }
      if (e.type === 'ATTRACTION' && e.attraction) {
        if (!e.attraction.isFree) {
          if (e.attraction.entryFeeForeign) {
            prices.push({ label: 'Entrée étranger', value: e.attraction.entryFeeForeign })
          }
          if (e.attraction.entryFeeLocal) {
            prices.push({ label: 'Entrée local', value: e.attraction.entryFeeLocal })
          }
        }
      }
      if (e.type === 'PROVIDER' && e.provider) {
        if (e.provider.priceFrom) {
          prices.push({ label: `Prix min${e.provider.priceUnit ? ` (${e.provider.priceUnit})` : ''}`, value: e.provider.priceFrom })
        }
        if (e.provider.priceTo) {
          prices.push({ label: `Prix max${e.provider.priceUnit ? ` (${e.provider.priceUnit})` : ''}`, value: e.provider.priceTo })
        }
      }

      return { id: e.id, name: e.name, type: e.type, prices }
    })

    return NextResponse.json({
      seasons: seasons.map(s => ({
        id: s.id,
        name: s.name,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        priceMultiplier: s.priceMultiplier,
        priceMultipliers: s.priceMultipliers ? JSON.parse(s.priceMultipliers) : null,
        isActive: s.isActive,
      })),
      establishments: establishmentPrices,
    })
  } catch (error) {
    logger.error('Error fetching pricing', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const body = await request.json()

    const establishment = await prisma.establishment.findFirst({
      where: { claimedByUserId: user.id },
      select: { id: true },
    })

    if (!establishment) {
      return NextResponse.json({ error: 'Aucun établissement trouvé' }, { status: 404 })
    }

    await prisma.seasonalPricing.create({
      data: {
        establishmentId: establishment.id,
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        priceMultiplier: body.priceMultiplier || 1.0,
        priceMultipliers: body.priceMultipliers ? JSON.stringify(body.priceMultipliers) : null,
        isActive: body.isActive ?? true,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    logger.error('Error creating pricing', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    // Verify ownership
    const pricing = await prisma.seasonalPricing.findUnique({
      where: { id: body.id },
      include: { establishment: { select: { claimedByUserId: true } } },
    })

    if (!pricing || pricing.establishment.claimedByUserId !== user.id) {
      return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
    }

    await prisma.seasonalPricing.update({
      where: { id: body.id },
      data: {
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        priceMultiplier: body.priceMultiplier,
        priceMultipliers: body.priceMultipliers ? JSON.stringify(body.priceMultipliers) : null,
        isActive: body.isActive,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error updating pricing', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

    const pricing = await prisma.seasonalPricing.findUnique({
      where: { id },
      include: { establishment: { select: { claimedByUserId: true } } },
    })

    if (!pricing || pricing.establishment.claimedByUserId !== user.id) {
      return NextResponse.json({ error: 'Non trouvé' }, { status: 404 })
    }

    await prisma.seasonalPricing.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error deleting pricing', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
