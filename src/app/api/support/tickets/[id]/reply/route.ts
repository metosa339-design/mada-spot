import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-response'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  })
  if (!ticket) return apiError('Ticket non trouvé', 404)

  const { content } = await request.json()
  if (!content) return apiError('Contenu requis')

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: id,
      authorId: session.userId,
      authorType: 'user',
      content,
    },
  })

  // Update ticket status back to OPEN if it was waiting for user
  if (ticket.status === 'WAITING_USER') {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: 'OPEN' },
    })
  }

  return NextResponse.json({ success: true, reply }, { status: 201 })
}
