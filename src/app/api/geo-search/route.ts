import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/geo-search?q=ambositra — Search cities + establishments for map autocomplete
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ cities: [], establishments: [] })
  }

  try {
    const [cities, establishments] = await Promise.all([
      // Search cities
      prisma.city.findMany({
        where: {
          isActive: true,
          name: { contains: q, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          latitude: true,
          longitude: true,
          region: true,
        },
        take: 5,
      }),
      // Search establishments
      prisma.establishment.findMany({
        where: {
          isActive: true,
          archivedAt: null,
          latitude: { not: null },
          longitude: { not: null },
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { city: { contains: q, mode: 'insensitive' } },
            { district: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
          city: true,
          district: true,
          latitude: true,
          longitude: true,
          rating: true,
          reviewCount: true,
          coverImage: true,
        },
        take: 8,
        orderBy: [{ isFeatured: 'desc' }, { rating: 'desc' }],
      }),
    ])

    return NextResponse.json({ cities, establishments })
  } catch {
    return NextResponse.json({ cities: [], establishments: [] })
  }
}
