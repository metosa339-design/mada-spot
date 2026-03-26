import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { logger } from '@/lib/logger'

// ============================================
// GET - Fetch all promotions for the authenticated user's establishments
// ============================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    // Find all establishments claimed by this user
    const establishments = await prisma.establishment.findMany({
      where: { claimedByUserId: user.id },
      select: { id: true },
    })

    if (establishments.length === 0) {
      return NextResponse.json({ success: true, promotions: [] })
    }

    const establishmentIds = establishments.map(e => e.id)

    const promotions = await prisma.promotion.findMany({
      where: { establishmentId: { in: establishmentIds } },
      include: {
        establishment: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map to backward-compatible shape (dashboard page uses promo.key)
    const formatted = promotions.map(p => ({
      key: p.id,
      id: p.id,
      title: p.title,
      description: p.description || '',
      discountPercent: p.discountPercent,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      isActive: p.isActive,
      establishmentId: p.establishmentId,
      establishmentName: p.establishment.name,
      updatedAt: p.updatedAt.toISOString(),
    }))

    return NextResponse.json({ success: true, promotions: formatted })
  } catch (error) {
    logger.error(
      'Error fetching promotions',
      error instanceof Error ? error : undefined,
      'Dashboard/Promotions'
    )
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ============================================
// POST - Create a promotion for an establishment
// ============================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()
    const {
      establishmentId,
      title,
      description,
      discountPercent,
      startDate,
      endDate,
      isActive,
    } = body

    // Validate required fields
    if (!establishmentId || !title || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants (establishmentId, title, startDate, endDate)' },
        { status: 400 }
      )
    }

    if (discountPercent != null && (discountPercent < 0 || discountPercent > 100)) {
      return NextResponse.json(
        { error: 'Le pourcentage de réduction doit être entre 0 et 100' },
        { status: 400 }
      )
    }

    // Verify the establishment belongs to the authenticated user
    const establishment = await prisma.establishment.findFirst({
      where: {
        id: establishmentId,
        claimedByUserId: user.id,
      },
      select: { id: true, name: true },
    })

    if (!establishment) {
      return NextResponse.json(
        { error: 'Établissement non trouvé ou non autorisé' },
        { status: 404 }
      )
    }

    const promotion = await prisma.promotion.create({
      data: {
        establishmentId: establishment.id,
        title,
        description: description || null,
        discountPercent: discountPercent ?? 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive ?? true,
      },
    })

    logger.info(
      `Promotion created: "${title}" for establishment ${establishment.name}`,
      'Dashboard/Promotions',
      { promotionId: promotion.id, establishmentId }
    )

    return NextResponse.json(
      {
        success: true,
        key: promotion.id,
        promotion: {
          key: promotion.id,
          id: promotion.id,
          title: promotion.title,
          description: promotion.description || '',
          discountPercent: promotion.discountPercent,
          startDate: promotion.startDate.toISOString(),
          endDate: promotion.endDate.toISOString(),
          isActive: promotion.isActive,
          establishmentId: promotion.establishmentId,
          establishmentName: establishment.name,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error(
      'Error creating promotion',
      error instanceof Error ? error : undefined,
      'Dashboard/Promotions'
    )
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// ============================================
// DELETE - Remove a promotion by its ID
// ============================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) return authResult
    const { user } = authResult

    const body = await request.json()
    const { promotionKey } = body

    if (!promotionKey) {
      return NextResponse.json(
        { error: 'promotionKey est requis' },
        { status: 400 }
      )
    }

    // Fetch the promotion and verify ownership
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionKey },
      include: { establishment: { select: { claimedByUserId: true } } },
    })

    if (!promotion) {
      return NextResponse.json(
        { error: 'Promotion non trouvée' },
        { status: 404 }
      )
    }

    if (promotion.establishment.claimedByUserId !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer cette promotion' },
        { status: 403 }
      )
    }

    await prisma.promotion.delete({
      where: { id: promotionKey },
    })

    logger.info(
      `Promotion deleted: ${promotionKey}`,
      'Dashboard/Promotions',
      { promotionKey, establishmentId: promotion.establishmentId }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error(
      'Error deleting promotion',
      error instanceof Error ? error : undefined,
      'Dashboard/Promotions'
    )
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
