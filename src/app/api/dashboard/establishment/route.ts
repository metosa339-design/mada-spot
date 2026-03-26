import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { verifySession, SESSION_COOKIE_NAME } from '@/lib/auth/session'
import { logger } from '@/lib/logger'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
    if (!token) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const user = await verifySession(token)
    if (!user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const establishment = await prisma.establishment.findFirst({
      where: { claimedByUserId: user.id },
      include: {
        hotel: true,
        restaurant: true,
        attraction: true,
        provider: true,
      },
    })

    if (!establishment) {
      return NextResponse.json({ establishment: null })
    }

    const images = establishment.images ? JSON.parse(establishment.images) : []

    const result: Record<string, unknown> = {
      id: establishment.id,
      name: establishment.name,
      type: establishment.type,
      description: establishment.description || '',
      shortDescription: establishment.shortDescription || '',
      address: establishment.address || '',
      city: establishment.city,
      region: establishment.region || '',
      latitude: establishment.latitude,
      longitude: establishment.longitude,
      phone: establishment.phone || '',
      phone2: establishment.phone2 || '',
      email: establishment.email || '',
      website: establishment.website || '',
      facebook: establishment.facebook || '',
      instagram: establishment.instagram || '',
      whatsapp: establishment.whatsapp || '',
      coverImage: establishment.coverImage || '',
      images,
    }

    // Add type-specific fields
    if (establishment.hotel) {
      result.starRating = establishment.hotel.starRating || 3
      result.checkInTime = establishment.hotel.checkInTime || '14:00'
      result.checkOutTime = establishment.hotel.checkOutTime || '11:00'
      result.amenities = establishment.hotel.amenities ? JSON.parse(establishment.hotel.amenities) : []
      result.openingHours = establishment.hotel.openingHours ? JSON.parse(establishment.hotel.openingHours) : {}
    }
    if (establishment.restaurant) {
      result.cuisineTypes = establishment.restaurant.cuisineTypes ? JSON.parse(establishment.restaurant.cuisineTypes) : []
      result.menuImages = establishment.restaurant.menuImages ? JSON.parse(establishment.restaurant.menuImages) : []
      result.hasDelivery = establishment.restaurant.hasDelivery
      result.hasTakeaway = establishment.restaurant.hasTakeaway
      result.hasReservation = establishment.restaurant.hasReservation
      result.amenities = []
      if (establishment.restaurant.hasWifi) (result.amenities as string[]).push('wifi')
      if (establishment.restaurant.hasParking) (result.amenities as string[]).push('parking')
      if (establishment.restaurant.hasGenerator) (result.amenities as string[]).push('generator')
      result.openingHours = establishment.restaurant.openingHours ? JSON.parse(establishment.restaurant.openingHours) : {}
    }

    return NextResponse.json({ establishment: result })
  } catch (error) {
    logger.error('Error fetching establishment', error instanceof Error ? error : undefined)
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
    const slug = slugify(body.name) + '-' + Date.now().toString(36)

    const establishment = await prisma.establishment.create({
      data: {
        type: body.type || 'HOTEL',
        name: body.name,
        slug,
        description: body.description || null,
        shortDescription: body.shortDescription || null,
        address: body.address || null,
        city: body.city || 'Non spécifié',
        region: body.region || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        phone: body.phone || null,
        phone2: body.phone2 || null,
        email: body.email || null,
        website: body.website || null,
        facebook: body.facebook || null,
        instagram: body.instagram || null,
        whatsapp: body.whatsapp || null,
        coverImage: body.coverImage || null,
        images: JSON.stringify(body.images || []),
        isClaimed: true,
        claimedByUserId: user.id,
        claimedAt: new Date(),
        dataSource: 'user_contribution',
        moderationStatus: 'pending_review',
      },
    })

    // Create type-specific record
    if (body.type === 'HOTEL') {
      await prisma.hotel.create({
        data: {
          establishmentId: establishment.id,
          starRating: body.starRating || 3,
          checkInTime: body.checkInTime || '14:00',
          checkOutTime: body.checkOutTime || '11:00',
          amenities: JSON.stringify(body.amenities || []),
          openingHours: JSON.stringify(body.openingHours || {}),
        },
      })
    } else if (body.type === 'RESTAURANT') {
      await prisma.restaurant.create({
        data: {
          establishmentId: establishment.id,
          category: 'RESTAURANT',
          priceRange: 'MODERATE',
          cuisineTypes: JSON.stringify(body.cuisineTypes || []),
          menuImages: JSON.stringify(body.menuImages || []),
          openingHours: JSON.stringify(body.openingHours || {}),
          hasDelivery: body.hasDelivery || false,
          hasTakeaway: body.hasTakeaway || false,
          hasReservation: body.hasReservation || false,
          hasWifi: (body.amenities || []).includes('wifi'),
          hasParking: (body.amenities || []).includes('parking'),
          hasGenerator: (body.amenities || []).includes('generator'),
        },
      })
    } else if (body.type === 'ATTRACTION') {
      await prisma.attraction.create({
        data: {
          establishmentId: establishment.id,
          attractionType: 'park',
          openingHours: JSON.stringify(body.openingHours || {}),
        },
      })
    } else if (body.type === 'PROVIDER') {
      await prisma.provider.create({
        data: {
          establishmentId: establishment.id,
          serviceType: 'TOUR_OPERATOR',
        },
      })
    }

    // Update user type if not set
    await prisma.user.update({
      where: { id: user.id },
      data: { userType: body.type || 'HOTEL' },
    })

    return NextResponse.json({ establishment: { id: establishment.id } }, { status: 201 })
  } catch (error) {
    logger.error('Error creating establishment', error instanceof Error ? error : undefined)
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
    const existing = await prisma.establishment.findFirst({
      where: { id: body.id, claimedByUserId: user.id },
    })
    if (!existing) return NextResponse.json({ error: 'Établissement non trouvé' }, { status: 404 })

    await prisma.establishment.update({
      where: { id: body.id },
      data: {
        name: body.name,
        description: body.description || null,
        shortDescription: body.shortDescription || null,
        address: body.address || null,
        city: body.city || existing.city,
        region: body.region || null,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        phone: body.phone || null,
        phone2: body.phone2 || null,
        email: body.email || null,
        website: body.website || null,
        facebook: body.facebook || null,
        instagram: body.instagram || null,
        whatsapp: body.whatsapp || null,
        coverImage: body.coverImage || null,
        images: JSON.stringify(body.images || []),
      },
    })

    // Update type-specific record
    if (existing.type === 'HOTEL') {
      await prisma.hotel.updateMany({
        where: { establishmentId: body.id },
        data: {
          starRating: body.starRating,
          checkInTime: body.checkInTime,
          checkOutTime: body.checkOutTime,
          amenities: JSON.stringify(body.amenities || []),
          openingHours: JSON.stringify(body.openingHours || {}),
        },
      })
    } else if (existing.type === 'RESTAURANT') {
      await prisma.restaurant.updateMany({
        where: { establishmentId: body.id },
        data: {
          cuisineTypes: JSON.stringify(body.cuisineTypes || []),
          menuImages: JSON.stringify(body.menuImages || []),
          openingHours: JSON.stringify(body.openingHours || {}),
          hasDelivery: body.hasDelivery || false,
          hasTakeaway: body.hasTakeaway || false,
          hasReservation: body.hasReservation || false,
          hasWifi: (body.amenities || []).includes('wifi'),
          hasParking: (body.amenities || []).includes('parking'),
          hasGenerator: (body.amenities || []).includes('generator'),
        },
      })
    }

    return NextResponse.json({ establishment: { id: body.id } })
  } catch (error) {
    logger.error('Error updating establishment', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
