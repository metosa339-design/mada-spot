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

    // Get user's establishments
    const establishments = await prisma.establishment.findMany({
      where: { claimedByUserId: user.id },
      select: { id: true },
    })
    const establishmentIds = establishments.map(e => e.id)

    if (establishmentIds.length === 0) {
      return NextResponse.json({ reviews: [], stats: { average: 0, total: 0, unanswered: 0 } })
    }

    const reviews = await prisma.establishmentReview.findMany({
      where: {
        establishmentId: { in: establishmentIds },
        isPublished: true,
      },
      include: {
        establishment: {
          select: { name: true, coverImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    const total = reviews.length
    const unanswered = reviews.filter(r => !r.ownerResponse).length
    const average = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0

    return NextResponse.json({
      reviews: reviews.map(r => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        ownerResponse: r.ownerResponse,
        respondedAt: r.respondedAt?.toISOString() || null,
        createdAt: r.createdAt.toISOString(),
        isFlagged: r.isFlagged,
        flagReason: r.flagReason,
        establishment: {
          name: r.establishment.name,
          coverImage: r.establishment.coverImage,
        },
      })),
      stats: {
        average: Math.round(average * 10) / 10,
        total,
        unanswered,
      },
    })
  } catch (error) {
    logger.error('Error fetching reviews', error instanceof Error ? error : undefined)
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

    const { reviewId, response } = await request.json()
    if (!reviewId || !response) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Verify ownership
    const review = await prisma.establishmentReview.findUnique({
      where: { id: reviewId },
      include: { establishment: { select: { claimedByUserId: true } } },
    })

    if (!review || review.establishment.claimedByUserId !== user.id) {
      return NextResponse.json({ error: 'Avis non trouvé' }, { status: 404 })
    }

    await prisma.establishmentReview.update({
      where: { id: reviewId },
      data: {
        ownerResponse: response,
        respondedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Error responding to review', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
