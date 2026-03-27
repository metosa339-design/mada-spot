// OTP verification: generate, send, and verify 6-digit codes

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

const OTP_EXPIRY_MINUTES = 15
const MAX_OTP_PER_HOUR = 3


/** Escape user-supplied strings for safe HTML interpolation */
function h(str: string | number | null | undefined): string {
  const s = String(str ?? '')
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/**
 * Build the MadaSpot-branded OTP email HTML
 */
function buildOTPEmailHTML(code: string, firstName?: string): string {
  const digits = code.split('')
  const digitBoxes = digits
    .map(
      (d) =>
        `<td style="width: 48px; height: 56px; background: linear-gradient(135deg, #ff6b35, #e55a2b); color: white; font-size: 28px; font-weight: 700; text-align: center; border-radius: 12px; letter-spacing: 2px;">${h(d)}</td>`
    )
    .join('<td style="width: 8px;"></td>')

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f17;">
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #ff6b35, #ff1493); padding: 32px 20px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: 700;">Mada Spot</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">Bons Plans à Madagascar</p>
  </div>

  <!-- Body -->
  <div style="background: #f8fafc; padding: 32px 24px; border-radius: 0 0 12px 12px;">
    <h2 style="margin: 0 0 8px; color: #1a1a24; font-size: 20px;">
      Bienvenue${firstName ? ` ${h(firstName)}` : ''} sur MadaSpot !
    </h2>
    <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
      Utilisez le code ci-dessous pour valider votre adresse email et activer votre compte.
    </p>

    <!-- OTP Code -->
    <div style="text-align: center; margin: 24px 0;">
      <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr>${digitBoxes}</tr>
      </table>
    </div>

    <p style="text-align: center; color: #94a3b8; font-size: 13px; margin: 16px 0 0;">
      Ce code expire dans <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
    </p>

    <!-- Divider -->
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />

    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
      Si vous n'avez pas créé de compte sur Mada Spot, ignorez simplement cet email.<br/>
      Pour toute question, contactez-nous à <a href="mailto:contact@madaspot.mg" style="color: #ff6b35; text-decoration: none;">contact@madaspot.mg</a>
    </p>
  </div>

  <!-- Footer -->
  <div style="text-align: center; padding: 16px; color: #64748b; font-size: 11px;">
    © ${new Date().getFullYear()} Mada Spot — Tous droits réservés
  </div>
</div>`
}

/**
 * Create and send an OTP code to a user's email
 */
export async function sendOTPToUser(userId: string, email: string, firstName?: string): Promise<{ success: boolean; error?: string }> {
  // Rate limit: max 3 per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const recentCount = await prisma.oTPCode.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
    },
  })

  if (recentCount >= MAX_OTP_PER_HOUR) {
    return { success: false, error: 'Trop de codes envoyés. Réessayez dans une heure.' }
  }

  const code = generateOTP()
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  await prisma.oTPCode.create({
    data: { userId, code, expiresAt },
  })

  // Send branded email via the email API route (uses Resend)
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        subject: `${code} — Votre code de vérification Mada Spot`,
        html: buildOTPEmailHTML(code, firstName),
        secret: process.env.EMAIL_SECRET,
      }),
    })

    if (!res.ok) {
      const errorData = await res.text().catch(() => 'unknown')
      console.error(`[OTP] ❌ Échec envoi email via Resend (${res.status}):`, errorData)
      logger.error(`[OTP] Email send failed (${res.status}):`, errorData)
      return { success: false, error: 'Email non envoyé' }
    } else {
      logger.info(`[OTP] ✓ Code envoyé à ${email}`)
    }
  } catch (err) {
    console.error('[OTP] ❌ Erreur réseau lors de l\'envoi du mail:', err)
    logger.error('[OTP] Network error sending email:', err)
    return { success: false, error: 'Email non envoyé' }
  }

  return { success: true }
}

/**
 * Verify an OTP code for a user
 */
export async function verifyOTP(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
  const otpRecord = await prisma.oTPCode.findFirst({
    where: {
      userId,
      code,
      usedAt: null,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otpRecord) {
    return { success: false, error: 'Code invalide ou expiré.' }
  }

  // Mark as used
  await prisma.oTPCode.update({
    where: { id: otpRecord.id },
    data: { usedAt: new Date() },
  })

  // Set user as verified (both general + email)
  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: true, emailVerified: true },
  })

  // Clean up expired OTP codes for this user
  await prisma.oTPCode.deleteMany({
    where: {
      userId,
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  }).catch(() => {})

  return { success: true }
}
