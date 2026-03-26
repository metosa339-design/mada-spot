import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'
import { findDuplicates } from '@/lib/duplicate-detector'

export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const { searchParams } = new URL(request.url)
  const threshold = parseFloat(searchParams.get('threshold') || '0.7')

  const duplicates = await findDuplicates(threshold)
  return NextResponse.json({ duplicates, count: duplicates.length })
}
