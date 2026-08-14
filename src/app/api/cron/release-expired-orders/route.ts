// Mada Spot — Cron : libération des stocks des commandes expirées.
// À appeler périodiquement (ex : toutes les minutes). Auth via CRON_SECRET.

import { NextRequest, NextResponse } from 'next/server';
import { releaseExpiredOrders } from '@/lib/ticketing/orders';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handle(request: NextRequest) {
  const secret =
    request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // Fail-closed en production : pas de secret configuré → endpoint fermé.
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: 'Cron non configuré' }, { status: 503 });
    }
  } else if (secret !== cronSecret) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { processed } = await releaseExpiredOrders();
    return NextResponse.json({ success: true, data: { processed } });
  } catch (err) {
    logger.error('release-expired-orders a échoué', err, 'cron.release-expired-orders');
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function GET(request: NextRequest) {
  return handle(request);
}
