import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-response'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionToken = request.cookies.get('mada-spot-session')?.value
  if (!sessionToken) return apiError('Non authentifié', 401)
  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    select: { userId: true, expiresAt: true },
  })
  if (!session || session.expiresAt < new Date()) return apiError('Session expirée', 401)

  const { id } = await params
  const ticket = await prisma.supportTicket.findFirst({
    where: { id, userId: session.userId },
    include: { replies: { orderBy: { createdAt: 'asc' } } },
  })
  if (!ticket) return apiError('Ticket non trouvé', 404)

  return NextResponse.json({ ticket })
}
