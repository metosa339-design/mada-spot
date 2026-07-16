import { NextRequest, NextResponse } from 'next/server';
import { sendBoostExpiryReminders } from '@/lib/crm/boost-emails';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/cron/boost-expiry-reminder — relance J-1 des boosts qui expirent demain (auth CRON_SECRET)
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendBoostExpiryReminders();
  return NextResponse.json({ success: true, ...result });
}
