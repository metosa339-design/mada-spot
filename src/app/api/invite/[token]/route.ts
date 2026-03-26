import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-response'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const claim = await prisma.establishmentClaim.findFirst({
    where: {
      invitationToken: token,
      invitationExpiry: { gte: new Date() },
    },
    include: {
      establishment: { select: { id: true, name: true, type: true, city: true, coverImage: true } },
    },
  })

  if (!claim) return apiError('Invitation invalide ou expirée', 404)

  return NextResponse.json({
    establishment: claim.establishment,
    email: claim.claimantEmail,
    expiresAt: claim.invitationExpiry,
  })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json()
  const { name, phone } = body

  const claim = await prisma.establishmentClaim.findFirst({
    where: {
      invitationToken: token,
      invitationExpiry: { gte: new Date() },
      status: 'PENDING',
    },
  })

  if (!claim) return apiError('Invitation invalide ou expirée', 404)

  // Update claim
  await prisma.establishmentClaim.update({
    where: { id: claim.id },
    data: {
      claimantName: name || claim.claimantEmail,
      claimantPhone: phone,
      status: 'APPROVED',
      reviewedAt: new Date(),
      reviewedBy: 'system-invite',
    },
  })

  // Mark establishment as claimed
  await prisma.establishment.update({
    where: { id: claim.establishmentId },
    data: {
      isClaimed: true,
      isGhost: false,
      moderationStatus: 'approved',
      claimedAt: new Date(),
    },
  })

  return NextResponse.json({ success: true, establishmentId: claim.establishmentId })
}
