import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'
import { calculateTrustScore } from '@/lib/trust-score'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const { id } = await params
  const result = await calculateTrustScore(id)
  return NextResponse.json(result)
}
