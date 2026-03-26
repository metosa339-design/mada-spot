import { NextRequest, NextResponse } from 'next/server';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { ADMIN_COOKIE_NAME } from '@/lib/constants';

import { logger } from '@/lib/logger';
// GET /api/exchange-rates - Récupérer les taux de change actuels
export async function GET() {
  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { fetchedAt: 'desc' },
    });

    // Organiser par paire de devises
    const rateMap: Record<string, any> = {};
    for (const rate of rates) {
      const key = `${rate.baseCurrency}_${rate.targetCurrency}`;
      if (!rateMap[key]) {
        rateMap[key] = rate;
      }
    }

    return NextResponse.json({
      success: true,
      rates: Object.values(rateMap),
      updatedAt: rates[0]?.fetchedAt || null,
    });
  } catch (error: unknown) {
    logger.error('[EXCHANGE RATES] Get error:', error);
    return apiError('Erreur serveur', 500);
  }
}

// POST /api/exchange-rates - Mettre à jour un taux (admin)
export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!sessionId) return apiError('Non autorisé', 401);
  const user = await getSession(sessionId);
  if (!user) return apiError('Non autorisé', 401);

  try {
    const _body = await request.json().catch(() => null);
    if (_body === null) return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    const { baseCurrency, targetCurrency, rate, source } = _body;

    if (!baseCurrency || !targetCurrency || !rate || rate <= 0) {
      return NextResponse.json(
        { error: 'baseCurrency, targetCurrency et rate (> 0) requis' },
        { status: 400 }
      );
    }

    const exchangeRate = await prisma.exchangeRate.upsert({
      where: {
        baseCurrency_targetCurrency: { baseCurrency, targetCurrency },
      },
      update: {
        rate: parseFloat(rate),
        source: source || 'manual',
        fetchedAt: new Date(),
      },
      create: {
        baseCurrency,
        targetCurrency,
        rate: parseFloat(rate),
        source: source || 'manual',
      },
    });

    return NextResponse.json({ success: true, exchangeRate });
  } catch (error: unknown) {
    logger.error('[EXCHANGE RATES] Update error:', error);
    return apiError('Erreur serveur', 500);
  }
}
