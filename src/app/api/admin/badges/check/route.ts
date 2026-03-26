import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'
import { checkAndAwardBadges } from '@/lib/badges'
import { logAudit, getRequestMeta } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  // Find all users with at least 1 published review
  const users = await prisma.user.findMany({
    where: { establishmentReviews: { some: { isPublished: true } } },
    select: { id: true },
  })

  let awarded = 0
  for (const user of users) {
    const badges = await checkAndAwardBadges(user.id)
    if (badges.length > 0) awarded++
  }

  await logAudit({
    userId: admin.id,
    action: 'badges_batch_check',
    entityType: 'user_badge',
    details: { usersChecked: users.length, usersAwarded: awarded },
    ...getRequestMeta(request),
  })

  return NextResponse.json({ success: true, usersChecked: users.length, usersAwarded: awarded })
}
