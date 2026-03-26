import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  // Simple cron auth via secret header or query param
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Find archived establishments older than 30 days
  const toDelete = await prisma.establishment.findMany({
    where: { archivedAt: { lte: thirtyDaysAgo } },
    select: { id: true, name: true },
  })

  let deleted = 0
  for (const est of toDelete) {
    try {
      await prisma.establishment.delete({ where: { id: est.id } })
      deleted++
    } catch { /* skip if foreign key issues */ }
  }

  return NextResponse.json({ success: true, found: toDelete.length, deleted })
}
