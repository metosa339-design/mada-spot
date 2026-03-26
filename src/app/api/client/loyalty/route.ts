import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { getLoyaltyTier } from '@/lib/loyalty'
import { logger } from '@/lib/logger'

// GET /api/client/loyalty — Points, tier, and transaction history
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const { user: sessionUser } = auth

    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { loyaltyPoints: true },
      }),
      prisma.loyaltyTransaction.findMany({
        where: { userId: sessionUser.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])

    const points = Math.max(0, user?.loyaltyPoints ?? 0)
    const tier = getLoyaltyTier(points)

    return NextResponse.json({
      points,
      tier,
      transactions: transactions.map(t => ({
        id: t.id,
        type: t.type,
        points: t.points,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    logger.error('Error fetching loyalty data', error instanceof Error ? error : undefined)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
