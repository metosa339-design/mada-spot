import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const matchType = searchParams.get('type')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const where: any = {}
  if (status) where.status = status
  if (matchType) where.matchType = matchType

  const [alerts, total] = await Promise.all([
    prisma.messageScanAlert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.messageScanAlert.count({ where }),
  ])

  return NextResponse.json({ alerts, total, page, limit })
}
