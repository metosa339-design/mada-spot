import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const clicks = await prisma.outboundClick.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { clickType: true, establishmentId: true, createdAt: true },
  })

  // Total
  const total = clicks.length

  // By type
  const byType: Record<string, number> = {}
  for (const c of clicks) {
    byType[c.clickType] = (byType[c.clickType] || 0) + 1
  }

  // By day
  const byDay = new Map<string, number>()
  for (const c of clicks) {
    const day = c.createdAt.toISOString().slice(0, 10)
    byDay.set(day, (byDay.get(day) || 0) + 1)
  }
  const dailyChart = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))

  // Top 10 establishments
  const byEstablishment = new Map<string, number>()
  for (const c of clicks) {
    byEstablishment.set(c.establishmentId, (byEstablishment.get(c.establishmentId) || 0) + 1)
  }
  const topEstIds = [...byEstablishment.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const topEstablishments = await Promise.all(
    topEstIds.map(async ([id, count]) => {
      const est = await prisma.establishment.findUnique({
        where: { id },
        select: { id: true, name: true, type: true, city: true },
      })
      return { ...est, clicks: count }
    })
  )

  return NextResponse.json({ total, byType, dailyChart, topEstablishments })
}
