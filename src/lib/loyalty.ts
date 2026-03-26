import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

// Point values per action
export const LOYALTY_POINTS = {
  BOOKING_COMPLETE: 100,
  REVIEW_POSTED: 50,
  FAVORITE_ADDED: 10,
  FAVORITE_REMOVED: -10,
} as const

// Tier thresholds
const TIERS = [
  { name: 'Bronze', minPoints: 0, color: '#CD7F32' },
  { name: 'Argent', minPoints: 500, color: '#C0C0C0' },
  { name: 'Or', minPoints: 2000, color: '#FFD700' },
  { name: 'Platine', minPoints: 5000, color: '#E5E4E2' },
]

export function getLoyaltyTier(points: number) {
  let tier = TIERS[0]
  for (const t of TIERS) {
    if (points >= t.minPoints) tier = t
  }

  // Find next tier
  const currentIndex = TIERS.indexOf(tier)
  const nextTier = currentIndex < TIERS.length - 1 ? TIERS[currentIndex + 1] : null

  return {
    name: tier.name,
    color: tier.color,
    minPoints: tier.minPoints,
    nextTier: nextTier ? { name: nextTier.name, minPoints: nextTier.minPoints } : null,
    progress: nextTier
      ? Math.min(100, Math.round(((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100))
      : 100,
  }
}

export async function awardLoyaltyPoints({
  userId,
  type,
  points,
  description,
  entityId,
}: {
  userId: string
  type: 'BOOKING_COMPLETE' | 'REVIEW_POSTED' | 'FAVORITE_ADDED' | 'FAVORITE_REMOVED' | 'BONUS'
  points: number
  description: string
  entityId?: string
}) {
  try {
    await prisma.$transaction([
      prisma.loyaltyTransaction.create({
        data: {
          userId,
          type,
          points,
          description,
          entityId: entityId || null,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          loyaltyPoints: { increment: points },
        },
      }),
    ])
  } catch (error) {
    logger.error('Error awarding loyalty points', error instanceof Error ? error : undefined)
  }
}
