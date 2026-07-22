import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db'
import { checkAdminAuth } from '@/lib/api/admin-auth'
import { apiError } from '@/lib/api-response'
import { logAudit, getRequestMeta } from '@/lib/audit'
import { logger } from '@/lib/logger'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://madaspot.com'
const MAX_LIMIT = 1000

// Normalise un numéro malgache vers le format international sans "+"
// (utilisable dans un lien wa.me). Ex: "032 12 345 67" -> "261321234567"
function toWhatsappNumber(raw: string | null | undefined): string | null {
  if (!raw) return null
  let d = raw.replace(/[^\d]/g, '')
  if (!d) return null
  if (d.startsWith('261')) return d
  if (d.startsWith('0')) return '261' + d.slice(1)
  if (d.length === 9) return '261' + d // numéro local sans le 0
  return d
}

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/**
 * POST /api/admin/claims/generate-links
 * Génère (ou réutilise) un lien de revendication par fiche non-revendiquée,
 * pour une campagne "revendiquez votre fiche".
 *
 * Body:
 *   establishmentIds?: string[]           // cible explicite (ex: import récent)
 *   filters?: { type?, city?, limit? }     // OU cible par filtre
 *   expiresDays?: number                   // défaut 30
 */
export async function POST(request: NextRequest) {
  const admin = await checkAdminAuth(request)
  if (!admin) return apiError('Non autorisé', 401)

  const body = await request.json().catch(() => ({}))
  const { establishmentIds, filters, expiresDays } = body as {
    establishmentIds?: string[]
    filters?: { type?: string; city?: string; limit?: number }
    expiresDays?: number
  }

  const VALID_TYPES = ['HOTEL', 'RESTAURANT', 'ATTRACTION', 'PROVIDER']
  const limit = Math.min(Math.max(filters?.limit ?? 500, 1), MAX_LIMIT)
  const ttlDays = Math.min(Math.max(expiresDays ?? 30, 1), 90)
  const expiry = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)

  // Cible : fiches NON revendiquées uniquement.
  const where: Record<string, unknown> = { isClaimed: false }
  if (Array.isArray(establishmentIds) && establishmentIds.length > 0) {
    where.id = { in: establishmentIds.slice(0, MAX_LIMIT) }
  }
  if (filters?.type && VALID_TYPES.includes(filters.type)) where.type = filters.type
  if (filters?.city) where.city = filters.city

  const establishments = await prisma.establishment.findMany({
    where,
    select: { id: true, name: true, type: true, city: true, email: true, phone: true, whatsapp: true },
    take: limit,
    orderBy: { createdAt: 'desc' },
  })

  const recipients: Array<{
    establishmentId: string
    name: string
    type: string
    city: string | null
    email: string | null
    phone: string | null
    whatsapp: string | null
    claimUrl: string
    whatsappLink: string | null
  }> = []
  let created = 0
  let reused = 0
  const skippedNoContact: string[] = []

  for (const est of establishments) {
    const waNumber = toWhatsappNumber(est.whatsapp || est.phone)
    // Revendicable si on a un email OU un numéro (le claim par téléphone crée
    // le compte via le numéro, re-connexion ultérieure par OTP). On ne saute que
    // les fiches sans aucun moyen de contact.
    if (!est.email && !waNumber) {
      skippedNoContact.push(est.name)
      continue
    }

    // Idempotence : réutiliser un token PENDING encore valide s'il existe.
    const existing = await prisma.establishmentClaim.findFirst({
      where: {
        establishmentId: est.id,
        status: 'PENDING',
        invitationToken: { not: null },
        invitationExpiry: { gte: new Date() },
      },
      select: { invitationToken: true },
    })

    let token = existing?.invitationToken || null
    if (token) {
      reused++
    } else {
      token = randomUUID()
      await prisma.establishmentClaim.create({
        data: {
          establishmentId: est.id,
          claimantName: '',
          claimantEmail: est.email || '', // '' = revendication par téléphone
          claimantPhone: waNumber,
          claimantRole: 'owner',
          invitationToken: token,
          invitationExpiry: expiry,
          invitedAt: new Date(),
        },
      })
      created++
    }

    const claimUrl = `${SITE_URL}/invite/${token}`
    const waText = `Bonjour ! Votre établissement "${est.name}" est déjà référencé sur Mada Spot. Revendiquez-le gratuitement (badge Vérifié) en 2 min : ${claimUrl}`
    const whatsappLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}` : null

    recipients.push({
      establishmentId: est.id,
      name: est.name,
      type: est.type,
      city: est.city,
      email: est.email,
      phone: est.phone,
      whatsapp: est.whatsapp,
      claimUrl,
      whatsappLink,
    })
  }

  // CSV prêt pour import Brevo (mail-merge sur la colonne lien_revendication)
  const csvHeader = 'email,etablissement,ville,type,lien_revendication'
  const csvRows = recipients.map((r) =>
    [r.email || '', r.name, r.city || '', r.type, r.claimUrl].map((v) => csvEscape(String(v))).join(',')
  )
  const csv = [csvHeader, ...csvRows].join('\n')

  // Fiches non-revendiquées SANS aucun moyen de contact (ni email, ni tel, ni whatsapp)
  const noContactCount = await prisma.establishment.count({
    where: { isClaimed: false, email: null, phone: null, whatsapp: null },
  })

  const byEmail = recipients.filter((r) => r.email).length
  const byPhoneOnly = recipients.filter((r) => !r.email && r.whatsappLink).length

  await logAudit({
    userId: admin.id,
    action: 'claim_links_generated',
    entityType: 'establishment',
    entityId: 'bulk',
    details: { matched: establishments.length, created, reused, byEmail, byPhoneOnly },
    ...getRequestMeta(request),
  })

  logger.info(`[CLAIM-LINKS] ${recipients.length} liens (créés ${created}, réutilisés ${reused}) par admin ${admin.id}`)

  return NextResponse.json({
    success: true,
    summary: {
      matched: establishments.length,
      linksReady: recipients.length,
      created,
      reused,
      byEmail, // revendicables par email
      byPhoneOnly, // revendicables par téléphone (sans email)
      whatsappEligible: recipients.filter((r) => r.whatsappLink).length,
      skippedNoContact: skippedNoContact.length, // dans le lot ciblé, aucun contact
      unclaimedNoContactTotal: noContactCount, // total base : fiches non joignables
      expiresAt: expiry,
    },
    recipients,
    csv,
    skippedNoContactSample: skippedNoContact.slice(0, 20),
  })
}
