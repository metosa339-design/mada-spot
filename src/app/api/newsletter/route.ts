import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIdentifier, getRateLimitHeaders } from '@/lib/rate-limit';
import { apiError, getErrorMessage } from '@/lib/api-response';
import { verifyCsrfToken } from '@/lib/csrf';

import { logger } from '@/lib/logger';
export async function POST(request: NextRequest) {
  // Rate limiting
  const clientId = getClientIdentifier(request);
  const rateLimit = checkRateLimit(clientId, 'write');
  if (!rateLimit.success) {
    return new NextResponse(JSON.stringify({ success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', ...getRateLimitHeaders(rateLimit) },
    });
  }

  try {
    const data = await request.json().catch(() => null);
    if (data === null) return NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 });

    // CSRF verification (mandatory)
    if (!data.csrfToken || !verifyCsrfToken(data.csrfToken)) {
      return apiError('Token CSRF invalide ou manquant', 403);
    }

    const { email } = data;

    if (!email || typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError('Email invalide');
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({ success: true, message: 'Vous êtes déjà abonné(e) !' });
      }
      await prisma.newsletterSubscriber.update({
        where: { email: normalizedEmail },
        data: { isActive: true, unsubscribedAt: null },
      });
      return NextResponse.json({ success: true, message: 'Réabonnement effectué avec succès !' });
    }

    await prisma.newsletterSubscriber.create({ data: { email: normalizedEmail } });

    return NextResponse.json({ success: true, message: 'Inscription réussie ! Bienvenue dans notre newsletter.' });
  } catch (error: unknown) {
    logger.error('Newsletter subscribe error:', error);
    return apiError(getErrorMessage(error), 500);
  }
}
