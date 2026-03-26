import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-response'
import { verifyOTP } from '@/lib/otp'

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get('mada-spot-session')?.value
  if (!sessionToken) return apiError('Non authentifié', 401)

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    select: { userId: true, expiresAt: true },
  })

  if (!session || session.expiresAt < new Date()) return apiError('Session expirée', 401)

  const { code } = await request.json()
  if (!code || typeof code !== 'string') return apiError('Code requis')

  const result = await verifyOTP(session.userId, code)
  if (!result.success) return apiError(result.error || 'Code invalide')

  return NextResponse.json({ success: true, message: 'Compte vérifié' })
}
