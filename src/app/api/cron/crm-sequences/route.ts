import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { computeScore } from '@/lib/crm/scoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/cron/crm-sequences — automatisations CRM (auth CRON_SECRET)
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = Date.now();
  const days = (n: number) => new Date(now - n * 86400000);

  // 1) Marquer OVERDUE les relances échues
  const overdue = await prisma.followUp.updateMany({
    where: { status: 'PENDING', dueAt: { lt: new Date() } },
    data: { status: 'OVERDUE' },
  });

  // 2) Recalcul du score + passage en UNRESPONSIVE
  const candidates = await prisma.prospect.findMany({
    where: { status: { in: ['NEW', 'CONTACTED', 'ENGAGED', 'QUALIFIED'] } },
    select: {
      id: true, status: true, score: true, contactAttempts: true,
      lastContactedAt: true, lastInboundAt: true, convertedAt: true,
      _count: { select: { conversations: true } },
    },
    take: 1000,
  });

  let rescored = 0;
  let markedUnresponsive = 0;
  for (const p of candidates) {
    const newScore = computeScore({
      status: p.status,
      contactAttempts: p.contactAttempts,
      lastContactedAt: p.lastContactedAt,
      lastInboundAt: p.lastInboundAt,
      convertedAt: p.convertedAt,
      hasConversations: p._count.conversations > 0,
    });

    // Silencieux : ≥3 relances, dernier contact > 7j, jamais de réponse depuis
    const noReplySince = !p.lastInboundAt || (p.lastContactedAt && p.lastInboundAt < p.lastContactedAt);
    const goneQuiet =
      ['CONTACTED', 'ENGAGED'].includes(p.status) &&
      p.contactAttempts >= 3 &&
      p.lastContactedAt !== null &&
      p.lastContactedAt < days(7) &&
      noReplySince;

    if (goneQuiet) {
      await prisma.prospect.update({ where: { id: p.id }, data: { status: 'UNRESPONSIVE', score: newScore } });
      markedUnresponsive++;
    } else if (newScore !== p.score) {
      await prisma.prospect.update({ where: { id: p.id }, data: { score: newScore } });
      rescored++;
    }
  }

  // 3) Créer une relance pour les leads QUALIFIED sans relance en attente et froids depuis 3j
  const qualified = await prisma.prospect.findMany({
    where: {
      status: 'QUALIFIED',
      OR: [{ lastContactedAt: { lt: days(3) } }, { lastContactedAt: null }],
      followUps: { none: { status: { in: ['PENDING', 'OVERDUE'] } } },
    },
    select: { id: true, firstName: true, company: true },
    take: 200,
  });

  let followUpsCreated = 0;
  for (const q of qualified) {
    await prisma.followUp.create({
      data: {
        prospectId: q.id,
        title: `Relancer ${q.firstName || q.company || 'ce lead qualifié'}`,
        description: 'Lead chaud sans contact récent — à relancer.',
        dueAt: new Date(now + 86400000), // demain
        status: 'PENDING',
      },
    });
    followUpsCreated++;
  }

  return NextResponse.json({
    success: true,
    overdueMarked: overdue.count,
    rescored,
    markedUnresponsive,
    followUpsCreated,
  });
}
