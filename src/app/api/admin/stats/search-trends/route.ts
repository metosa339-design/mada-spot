import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'

export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Top 10 keywords (7 days)
  const recentSearches = await prisma.searchLog.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { query: true },
  })
  const keywordCounts = new Map<string, number>()
  for (const s of recentSearches) {
    const q = s.query.toLowerCase().trim()
    if (q) keywordCounts.set(q, (keywordCounts.get(q) || 0) + 1)
  }
  const topKeywords = [...keywordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }))

  // Daily volume (30 days)
  const monthSearches = await prisma.searchLog.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
  })
  const dailyVolume = new Map<string, number>()
  for (const s of monthSearches) {
    const day = s.createdAt.toISOString().slice(0, 10)
    dailyVolume.set(day, (dailyVolume.get(day) || 0) + 1)
  }
  const volumeChart = [...dailyVolume.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))

  // Zero-result queries (7 days)
  const zeroResults = await prisma.searchLog.findMany({
    where: { createdAt: { gte: sevenDaysAgo }, resultCount: 0 },
    select: { query: true },
  })
  const zeroCountMap = new Map<string, number>()
  for (const s of zeroResults) {
    const q = s.query.toLowerCase().trim()
    if (q) zeroCountMap.set(q, (zeroCountMap.get(q) || 0) + 1)
  }
  const zeroResultQueries = [...zeroCountMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([query, count]) => ({ query, count }))

  return NextResponse.json({ topKeywords, volumeChart, zeroResultQueries })
}
