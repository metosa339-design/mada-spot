// Gamification Badges: check and award badges based on user activity

import { prisma } from '@/lib/db'

const BADGE_THRESHOLDS = [
  { badge: 'EXPLORATEUR' as const, minReviews: 5 },
  { badge: 'GUIDE_LOCAL' as const, minReviews: 10 },
  { badge: 'EXPERT_MADAGASCAR' as const, minReviews: 20 },
]

/**
 * Check user's review count and award earned badges
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const reviewCount = await prisma.establishmentReview.count({
    where: { userId, isPublished: true },
  })

  const awarded: string[] = []

  for (const { badge, minReviews } of BADGE_THRESHOLDS) {
    if (reviewCount >= minReviews) {
      try {
        await prisma.userBadge.upsert({
          where: { userId_badge: { userId, badge } },
          update: {},
          create: { userId, badge },
        })
        awarded.push(badge)
      } catch {
        // Ignore duplicate
      }
    }
  }

  return awarded
}
