import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'
import { logAudit, getRequestMeta } from '@/lib/audit'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const { id } = await params
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      replies: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!ticket) return apiError('Ticket non trouvé', 404)

  return NextResponse.json({ ticket })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const { id } = await params
  const body = await request.json()
  const { status, priority, assignedTo } = body

  const data: any = {}
  if (status) data.status = status
  if (priority) data.priority = priority
  if (assignedTo !== undefined) data.assignedTo = assignedTo

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data,
  })

  await logAudit({
    userId: admin.id,
    action: 'ticket_update',
    entityType: 'support_ticket',
    entityId: id,
    details: data,
    ...getRequestMeta(request),
  })

  return NextResponse.json({ success: true, ticket })
}
