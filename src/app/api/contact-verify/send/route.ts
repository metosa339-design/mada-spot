import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit'

// In-memory OTP store (code + expiry) — keyed by email
const otpStore = new Map<string, { code: string; expiresAt: number }>()

// Cleanup expired codes periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of otpStore) {
    if (val.expiresAt < now) otpStore.delete(key)
  }
}, 60_000)

export { otpStore }

// ── Email HTML template ──────────────────────────────────────────────
function buildOtpEmailHtml(code: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ff6b35, #ff1493); padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Mada Spot</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Vérification de votre email</p>
      </div>
      <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px;">
        <h2 style="margin: 0 0 12px; text-align: center;">Votre code de vérification</h2>
        <div style="background: white; padding: 20px; border-radius: 12px; margin: 16px 0; text-align: center; border: 2px solid #ff6b35;">
          <p style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #ff6b35; margin: 0;">${code}</p>
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center;">Ce code expire dans 10 minutes.</p>
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin-top: 16px;">
          Si vous n'avez pas demandé ce code, ignorez cet email.
        </p>
      </div>
    </div>
  `
}

// ── Direct email send with fallback chain ────────────────────────────
async function sendEmailDirect(to: string, subject: string, html: string): Promise<{ sent: boolean; error?: string }> {
  const errors: string[] = []

  // Strategy 1: Resend API
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    console.log('[EMAIL] Tentative d\'envoi via Resend API...')
    try {
      const fromAddress = process.env.RESEND_FROM || process.env.SMTP_FROM || 'Mada Spot <onboarding@resend.dev>'
      console.log('[EMAIL] Expéditeur (from):', fromAddress, '→', to)

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
        }),
      })

      const resText = await res.text()
      console.log(`[EMAIL] Resend réponse (${res.status}):`, resText)

      if (res.ok) {
        console.log('[EMAIL] ✅ Resend: email envoyé avec succès à', to)
        return { sent: true }
      }

      const resendError = `Resend ${res.status}: ${resText}`
      console.warn(`[EMAIL] ⚠️ Resend a échoué (${res.status}), tentative SMTP...`)
      errors.push(resendError)
    } catch (err) {
      console.warn('[EMAIL] ⚠️ Resend fetch error, tentative SMTP...', err)
      errors.push(`Resend fetch error: ${err}`)
    }
  }

  // Strategy 2: SMTP via nodemailer (fallback)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('[EMAIL] Tentative d\'envoi via SMTP/Nodemailer...')
    try {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `Mada Spot <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      })

      console.log('[EMAIL] ✅ SMTP: email envoyé avec succès à', to)
      return { sent: true }
    } catch (err) {
      console.error('[EMAIL] ❌ SMTP error:', err)
      errors.push(`SMTP error: ${err}`)
    }
  }

  const allErrors = errors.join(' | ')
  console.error('[EMAIL] ❌ Tous les providers ont échoué:', allErrors || 'Aucun service email configuré')
  return { sent: false, error: allErrors || 'No email provider configured' }
}

// POST /api/contact-verify/send — Send a 6-digit OTP to any email
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(clientId, 'write')
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez plus tard.' },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

    const { email } = body
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format email invalide' }, { status: 400 })
    }

    // Check rate: max 3 codes per email per hour (30s cooldown between sends)
    const existing = otpStore.get(email.toLowerCase())
    if (existing && existing.expiresAt > Date.now() && (Date.now() - (existing.expiresAt - 10 * 60_000)) < 30_000) {
      return NextResponse.json({ error: 'Code déjà envoyé. Attendez 30 secondes.' }, { status: 429 })
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    otpStore.set(email.toLowerCase(), {
      code,
      expiresAt: Date.now() + 10 * 60_000, // 10 minutes
    })

    // Always log clearly in the terminal
    console.log('\n╔══════════════════════════════════════╗')
    console.log(`║  OTP CODE pour ${email}`)
    console.log(`║  CODE : ${code}`)
    console.log('╚══════════════════════════════════════╝\n')

    // Send email DIRECTLY (no self-fetch)
    const result = await sendEmailDirect(
      email,
      `Code de vérification MadaSpot : ${code}`,
      buildOtpEmailHtml(code),
    )

    if (!result.sent) {
      console.error('[OTP] ❌ Email non envoyé pour', email)
      if (result.error) console.error('[OTP] Détail:', result.error)
    }

    return NextResponse.json({
      success: true,
      message: result.sent ? 'Code envoyé par email' : 'Code envoyé (vérifiez le terminal)',
      emailSent: result.sent,
      // In dev, include error detail for debugging
      ...(process.env.NODE_ENV === 'development' && !result.sent ? { debug: result.error } : {}),
    })
  } catch (err) {
    console.error('[OTP] Erreur serveur:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
