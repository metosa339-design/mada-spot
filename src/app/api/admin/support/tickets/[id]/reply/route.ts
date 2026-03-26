import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const { id } = await params
  const { content, setWaiting } = await request.json()
  if (!content) return apiError('Contenu requis')

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: id,
      authorId: admin.id,
      authorType: 'admin',
      content,
    },
  })

  // Optionally set status to WAITING_USER
  if (setWaiting) {
    await prisma.supportTicket.update({
      where: { id },
      data: { status: 'WAITING_USER' },
    })
  }

  return NextResponse.json({ success: true, reply }, { status: 201 })
}
