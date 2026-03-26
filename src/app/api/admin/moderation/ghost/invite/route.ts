import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'
import { logAudit, getRequestMeta } from '@/lib/audit'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const { establishmentId, email } = await request.json()
  if (!establishmentId || !email) return apiError('establishmentId et email requis')

  const establishment = await prisma.establishment.findUnique({
    where: { id: establishmentId },
    select: { id: true, name: true, isGhost: true },
  })
  if (!establishment) return apiError('Établissement non trouvé', 404)

  const token = crypto.randomUUID()
  const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const claim = await prisma.establishmentClaim.create({
    data: {
      establishmentId,
      claimantName: '',
      claimantEmail: email,
      claimantRole: 'owner',
      invitationToken: token,
      invitationExpiry: expiry,
      invitedAt: new Date(),
    },
  })

  // Send invitation email
  try {
    const { sendNotification } = await import('@/lib/email')
    await sendNotification({
      to: email,
      type: 'reminder' as any,
      data: {
        subject: `Revendiquez votre fiche : ${establishment.name}`,
        title: 'Invitation à revendiquer votre établissement',
        message: `Vous êtes invité à revendiquer la fiche "${establishment.name}" sur Mada Spot. Cliquez sur le lien ci-dessous pour commencer.`,
        url: `/invite/${token}`,
      },
    })
  } catch { /* best effort */ }

  await logAudit({
    userId: admin.id,
    action: 'ghost_invite_sent',
    entityType: 'establishment',
    entityId: establishmentId,
    details: { email, token: token.slice(0, 8) + '...' },
    ...getRequestMeta(request),
  })

  const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://madaspot.mg'}/invite/${token}`
  return NextResponse.json({ success: true, claim, inviteUrl })
}
