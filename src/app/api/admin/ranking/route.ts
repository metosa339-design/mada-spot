import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { prisma } from '@/lib/db'
import { logAudit, getRequestMeta } from '@/lib/audit'
import { logger } from '@/lib/logger'

// GET: List establishments ordered by displayOrder for ranking management
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // HOTEL, RESTAURANT, ATTRACTION, PROVIDER
    const city = searchParams.get('city')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {
      isActive: true,
      moderationStatus: 'approved',
    }
    if (type) where.type = type
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [establishments, total, cities] = await Promise.all([
      prisma.establishment.findMany({
        where: where as any,
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          coverImage: true,
          rating: true,
          reviewCount: true,
          viewCount: true,
          isFeatured: true,
          isPremium: true,
          displayOrder: true,
          isClaimed: true,
        },
        orderBy: [
          { displayOrder: 'desc' },
          { isFeatured: 'desc' },
          { rating: 'desc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.establishment.count({ where: where as any }),
      // Get distinct cities for filter dropdown
      prisma.establishment.findMany({
        where: { isActive: true, moderationStatus: 'approved' },
        select: { city: true },
        distinct: ['city'],
        orderBy: { city: 'asc' },
      }),
    ])

    return NextResponse.json({
      establishments,
      total,
      cities: cities.map(c => c.city),
    })
  } catch (error) {
    logger.error('Admin ranking GET error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PUT: Batch update display order
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth(request)
    if (!admin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
    }

    const { rankings } = body as { rankings: { id: string; displayOrder: number }[] }

    if (!rankings || !Array.isArray(rankings) || rankings.length === 0) {
      return NextResponse.json({ error: 'rankings array requis' }, { status: 400 })
    }

    if (rankings.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 éléments par mise à jour' }, { status: 400 })
    }

    // Batch update using transaction
    await prisma.$transaction(
      rankings.map(r =>
        prisma.establishment.update({
          where: { id: r.id },
          data: { displayOrder: r.displayOrder },
        })
      )
    )

    // Audit log
    const meta = getRequestMeta(request)
    logAudit({
      userId: admin.id,
      action: 'ranking_update',
      entityType: 'establishment',
      entityId: 'batch',
      details: { count: rankings.length, sample: rankings.slice(0, 5) },
      ...meta,
    })

    return NextResponse.json({ success: true, updated: rankings.length })
  } catch (error) {
    logger.error('Admin ranking PUT error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
