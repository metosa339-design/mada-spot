import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'
import { logAudit, getRequestMeta } from '@/lib/audit'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const { id } = await params
  const body = await request.json()
  const { status, actionTaken } = body

  const alert = await prisma.messageScanAlert.findUnique({ where: { id } })
  if (!alert) return apiError('Alerte non trouvée', 404)

  // If masking, replace message content
  if (actionTaken === 'masked') {
    await prisma.message.update({
      where: { id: alert.messageId },
      data: { content: '[Message masqué par la modération]' },
    }).catch(() => {})
  }

  // If suspending sender
  if (actionTaken === 'suspended') {
    await prisma.user.update({
      where: { id: alert.senderId },
      data: { isBanned: true, banReason: 'Tentative de contournement de la plateforme' },
    }).catch(() => {})
  }

  const updated = await prisma.messageScanAlert.update({
    where: { id },
    data: {
      status: status || (actionTaken === 'dismissed' ? 'DISMISSED' : actionTaken === 'masked' ? 'MASKED' : 'REVIEWED'),
      actionTaken,
      reviewedBy: admin.id,
    },
  })

  await logAudit({
    userId: admin.id,
    action: 'scan_alert_action',
    entityType: 'message_scan_alert',
    entityId: id,
    details: { actionTaken, status },
    ...getRequestMeta(request),
  })

  return NextResponse.json({ success: true, alert: updated })
}
