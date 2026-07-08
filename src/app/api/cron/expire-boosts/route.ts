import { NextRequest, NextResponse } from 'next/server';
import { expireStaleBoosts } from '@/lib/crm/boost';

export const dynamic = 'force-dynamic';

// POST /api/cron/expire-boosts — expire les boosts échus (auth via CRON_SECRET)
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const expired = await expireStaleBoosts();
  return NextResponse.json({ success: true, expired });
}
