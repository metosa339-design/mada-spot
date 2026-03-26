import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit'

// POST /api/contact-verify/check — Verify a 6-digit code for an email
export async function POST(request: NextRequest) {
  const clientId = getClientIdentifier(request)
  const rateLimit = checkRateLimit(clientId, 'write')
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes.' },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    )
  }

  try {
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Corps invalide' }, { status: 400 })

    const { email, code } = body
    if (!email || !code) {
      return NextResponse.json({ error: 'Email et code requis' }, { status: 400 })
    }

    // Dynamic import to access the shared otpStore
    const { otpStore } = await import('../send/route')

    const stored = otpStore.get(email.toLowerCase())
    if (!stored) {
      return NextResponse.json({ error: 'Aucun code en attente pour cet email' }, { status: 400 })
    }

    if (stored.expiresAt < Date.now()) {
      otpStore.delete(email.toLowerCase())
      return NextResponse.json({ error: 'Code expiré. Demandez un nouveau code.' }, { status: 400 })
    }

    if (stored.code !== code) {
      return NextResponse.json({ error: 'Code incorrect' }, { status: 400 })
    }

    // Code is valid — clean up
    otpStore.delete(email.toLowerCase())

    return NextResponse.json({ success: true, verified: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
