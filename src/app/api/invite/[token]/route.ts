import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { apiError } from '@/lib/api-response'
import { hashPassword, createSession, getSessionCookieConfig } from '@/lib/auth'
import { logger } from '@/lib/logger'

// Normalise un numéro malgache en format international sans "+" (ex: 261341112233)
function toIntlPhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const d = String(raw).replace(/[^\d]/g, '')
  if (!d) return null
  if (d.startsWith('261')) return d
  if (d.startsWith('0')) return '261' + d.slice(1)
  if (d.length === 9) return '261' + d
  return d
}

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
    email: claim.claimantEmail || null, // '' (claim par téléphone) => null
    phone: claim.claimantPhone || null,
    alreadyClaimed: claim.status === 'APPROVED',
    expiresAt: claim.invitationExpiry,
  })
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const body = await request.json().catch(() => null)
  if (body === null) return apiError('Corps de requête invalide', 400)
  const { name, phone } = body

  const claim = await prisma.establishmentClaim.findFirst({
    where: {
      invitationToken: token,
      invitationExpiry: { gte: new Date() },
      status: 'PENDING',
    },
    include: { establishment: { select: { id: true, type: true } } },
  })

  if (!claim) return apiError('Invitation invalide ou expirée', 404)

  // Identité : email si présent, sinon téléphone (marché WhatsApp-first).
  // Re-connexion ultérieure : par email (mot de passe oublié) ou par OTP téléphone.
  const email = claim.claimantEmail?.trim() || null
  const ownerPhone = toIntlPhone(claim.claimantPhone || (typeof phone === 'string' ? phone : ''))

  if (!email && !ownerPhone) {
    return apiError('Invitation incomplète (ni email ni téléphone). Contactez le support.', 400)
  }

  const findExistingUser = async () =>
    (email ? await prisma.user.findUnique({ where: { email }, select: { id: true, userType: true } }) : null) ||
    (ownerPhone ? await prisma.user.findFirst({ where: { phone: ownerPhone }, select: { id: true, userType: true } }) : null)

  // 1. Trouver ou créer le compte propriétaire (onboarding par lien magique, sans mot de passe)
  let user = await findExistingUser()

  if (!user) {
    const trimmed = (typeof name === 'string' ? name : '').trim()
    const [firstName, ...rest] = trimmed ? trimmed.split(/\s+/) : []
    // Mot de passe aléatoire : le compte est passwordless.
    const randomPassword = await hashPassword(randomUUID() + randomUUID())
    try {
      user = await prisma.user.create({
        data: {
          email: email || null,
          phone: ownerPhone || null,
          firstName: firstName || (email ? email.split('@')[0] : 'Propriétaire'),
          lastName: rest.join(' ') || '-',
          password: randomPassword,
          role: 'CLIENT',
          userType: claim.establishment.type as Prisma.UserCreateInput['userType'],
          emailVerified: !!email,
          phoneVerified: !!ownerPhone,
          isVerified: true,
        },
        select: { id: true, userType: true },
      })
    } catch (err) {
      // Collision email OU téléphone (course entre deux clics) : on récupère l'existant.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        user = await findExistingUser()
      } else {
        throw err
      }
    }
  } else if (!user.userType) {
    // Compte voyageur existant qui revendique une fiche : on le promeut en pro.
    await prisma.user.update({
      where: { id: user.id },
      data: { userType: claim.establishment.type as Prisma.UserUpdateInput['userType'] },
    })
  }

  if (!user) return apiError('Impossible de rattacher le compte', 500)
  // TypeScript : à ce stade user est garanti non-null.
  const ownerId = user.id

  // 2. Revendication approuvée + fiche activée + rattachée au compte (transaction)
  await prisma.$transaction([
    prisma.establishmentClaim.update({
      where: { id: claim.id },
      data: {
        claimantName: name || claim.claimantEmail,
        claimantPhone: phone || null,
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedBy: 'system-invite',
      },
    }),
    prisma.establishment.update({
      where: { id: claim.establishmentId },
      data: {
        isClaimed: true,
        isGhost: false,
        isActive: true,
        moderationStatus: 'approved',
        claimedAt: new Date(),
        claimedByUserId: ownerId,
      },
    }),
    // Rejeter les autres revendications en attente pour le même établissement
    prisma.establishmentClaim.updateMany({
      where: {
        establishmentId: claim.establishmentId,
        id: { not: claim.id },
        status: 'PENDING',
      },
      data: {
        status: 'REJECTED',
        rejectionReason: 'Une autre revendication a été approuvée pour cet établissement',
        reviewedAt: new Date(),
      },
    }),
  ])

  logger.info(`[CLAIM] ✓ Fiche ${claim.establishmentId} revendiquée et rattachée à ${email || ownerPhone}`)

  // 2b. CRM : marquer le prospect correspondant comme CONVERTI (best-effort, non bloquant)
  try {
    const prospect = await prisma.prospect.findFirst({
      where: {
        status: { notIn: ['CONVERTED', 'UNSUBSCRIBED', 'REJECTED'] },
        OR: [
          ...(email ? [{ email }] : []),
          ...(ownerPhone ? [{ phone: ownerPhone }] : []),
        ],
      },
      select: { id: true },
    })
    if (prospect) {
      await prisma.prospect.update({
        where: { id: prospect.id },
        data: { status: 'CONVERTED', convertedAt: new Date(), convertedToUserId: ownerId },
      })
    }
  } catch (e) {
    logger.warn('[CLAIM] conversion prospect échouée (non bloquant)', e as any)
  }

  // 3. Connecter le propriétaire immédiatement (le lien magique fait office d'auth)
  const sessionToken = await createSession(
    ownerId,
    request.headers.get('user-agent') || undefined,
    request.headers.get('x-forwarded-for') || undefined,
  )

  const response = NextResponse.json({
    success: true,
    establishmentId: claim.establishmentId,
    loggedIn: true,
    redirectTo: '/dashboard',
  })
  response.cookies.set(getSessionCookieConfig(sessionToken))
  return response
}
