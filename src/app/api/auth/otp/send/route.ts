import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-response'
import { sendOTPToUser } from '@/lib/otp'

export async function POST(request: NextRequest) {
  // Get user from session cookie
  const sessionToken = request.cookies.get('mada-spot-session')?.value
  if (!sessionToken) return apiError('Non authentifié', 401)

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: { select: { id: true, email: true, emailVerified: true } } },
  })

  if (!session || session.expiresAt < new Date()) return apiError('Session expirée', 401)
  if (session.user.emailVerified) return apiError('Email déjà vérifié')
  if (!session.user.email) return apiError('Email requis pour la vérification')

  const result = await sendOTPToUser(session.user.id, session.user.email)
  if (!result.success) return apiError(result.error || 'Erreur', 429)

  return NextResponse.json({ success: true, message: 'Code envoyé' })
}
