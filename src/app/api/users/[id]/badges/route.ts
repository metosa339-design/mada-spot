import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const badges = await prisma.userBadge.findMany({
    where: { userId: id },
    select: { badge: true, awardedAt: true },
    orderBy: { awardedAt: 'asc' },
  })
  return NextResponse.json({ badges })
}
