import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

// GET /api/promotions — Public endpoint: all active promotions with establishment data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') // HOTEL, RESTAURANT, ATTRACTION, PROVIDER
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)

    const now = new Date()

    const where: any = {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    }

    if (category) {
      where.establishment = { type: category, isActive: true }
    } else {
      where.establishment = { isActive: true }
    }

    const promotions = await prisma.promotion.findMany({
      where,
      include: {
        establishment: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            city: true,
            coverImage: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
      orderBy: { endDate: 'asc' },
      take: limit,
    })

    // Enrich with price from type-specific table
    const enriched = await Promise.all(
      promotions.map(async (p) => {
        let priceFrom: number | null = null

        try {
          if (p.establishment.type === 'HOTEL') {
            const cheapestRoom = await prisma.roomType.findFirst({
              where: { hotel: { establishmentId: p.establishment.id }, isAvailable: true },
              orderBy: { pricePerNight: 'asc' },
              select: { pricePerNight: true },
            })
            priceFrom = cheapestRoom?.pricePerNight ?? null
          } else if (p.establishment.type === 'RESTAURANT') {
            const restaurant = await prisma.restaurant.findUnique({
              where: { establishmentId: p.establishment.id },
              select: { avgMainCourse: true },
            })
            priceFrom = restaurant?.avgMainCourse ?? null
          } else if (p.establishment.type === 'ATTRACTION') {
            const attraction = await prisma.attraction.findUnique({
              where: { establishmentId: p.establishment.id },
              select: { entryFeeForeign: true },
            })
            priceFrom = attraction?.entryFeeForeign ?? null
          } else if (p.establishment.type === 'PROVIDER') {
            const provider = await prisma.provider.findUnique({
              where: { establishmentId: p.establishment.id },
              select: { priceFrom: true },
            })
            priceFrom = provider?.priceFrom ?? null
          }
        } catch {
          // Non-critical, leave price as null
        }

        const typeSlug =
          p.establishment.type === 'HOTEL' ? 'hotels' :
          p.establishment.type === 'RESTAURANT' ? 'restaurants' :
          p.establishment.type === 'ATTRACTION' ? 'attractions' :
          'prestataires'

        return {
          id: p.id,
          title: p.title,
          description: p.description || '',
          discountPercent: p.discountPercent,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate.toISOString(),
          establishment: {
            id: p.establishment.id,
            name: p.establishment.name,
            slug: p.establishment.slug,
            type: p.establishment.type,
            city: p.establishment.city,
            coverImage: p.establishment.coverImage,
            rating: p.establishment.rating,
            reviewCount: p.establishment.reviewCount,
            url: `/bons-plans/${typeSlug}/${p.establishment.slug}`,
          },
          priceFrom,
          discountedPrice: priceFrom && p.discountPercent > 0
            ? Math.round(priceFrom * (1 - p.discountPercent / 100))
            : null,
        }
      })
    )

    return NextResponse.json({ promotions: enriched, total: enriched.length })
  } catch (error) {
    logger.error('Error fetching public promotions', error instanceof Error ? error : undefined)
    return NextResponse.json({ promotions: [], total: 0 })
  }
}
