import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Devises stockées (Ariary par 1 unité)
const TARGETS = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'ZAR'];

// POST /api/cron/fetch-exchange-rates — récupère les taux réels du jour (base MGA) et les enregistre.
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', { cache: 'no-store' });
    const data = await res.json();
    if (data?.result !== 'success' || !data.rates?.MGA) {
      return NextResponse.json({ success: false, error: 'Source indisponible' }, { status: 502 });
    }
    const r = data.rates as Record<string, number>;
    const mgaPerEur = r.MGA; // base EUR => MGA par 1 EUR

    const created: Record<string, number> = {};
    for (const cur of TARGETS) {
      if (!r[cur]) continue;
      const mgaPerUnit = Math.round((mgaPerEur / r[cur]) * 100) / 100; // Ariary pour 1 unité de `cur`
      await prisma.exchangeRate.create({
        data: { baseCurrency: 'MGA', targetCurrency: cur, rate: mgaPerUnit, source: 'open.er-api.com' },
      });
      created[cur] = mgaPerUnit;
    }

    // Purge : garder ~120 derniers relevés par devise (évite la croissance infinie)
    const old = await prisma.exchangeRate.findMany({ orderBy: { fetchedAt: 'desc' }, skip: 120 * TARGETS.length, select: { id: true } });
    if (old.length) await prisma.exchangeRate.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });

    // Rafraîchit la page publique tout de suite (sinon cache ISR jusqu'à 1h)
    revalidatePath('/taux-de-change');

    return NextResponse.json({ success: true, updatedAt: data.time_last_update_utc, rates: created });
  } catch (e) {
    return NextResponse.json({ success: false, error: e instanceof Error ? e.message : 'Erreur réseau' }, { status: 500 });
  }
}
