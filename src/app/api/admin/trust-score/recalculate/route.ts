import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'
import { calculateTrustScore } from '@/lib/trust-score'
import { logAudit, getRequestMeta } from '@/lib/audit'

export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const establishments = await prisma.establishment.findMany({
    where: { isClaimed: true, archivedAt: null },
    select: { id: true },
  })

  let updated = 0
  for (const est of establishments) {
    try {
      await calculateTrustScore(est.id)
      updated++
    } catch { /* skip */ }
  }

  await logAudit({
    userId: admin.id,
    action: 'trust_score_batch_recalculate',
    entityType: 'establishment',
    details: { total: establishments.length, updated },
    ...getRequestMeta(request),
  })

  return NextResponse.json({ success: true, total: establishments.length, updated })
}
