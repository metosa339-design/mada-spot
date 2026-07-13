import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { computeCompleteness } from '@/lib/crm/completeness';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/cron/recompute-completeness — recalcule le score de complétude de toutes les fiches (tri public).
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const list = await prisma.establishment.findMany({
    select: {
      id: true, completenessScore: true, coverImage: true, images: true, description: true, shortDescription: true,
      phone: true, email: true, website: true, address: true, latitude: true, longitude: true, city: true,
      facebook: true, instagram: true, whatsapp: true,
    },
  });

  let updated = 0;
  for (const e of list) {
    const score = computeCompleteness(e);
    if (score !== e.completenessScore) {
      await prisma.establishment.update({ where: { id: e.id }, data: { completenessScore: score } }).catch(() => {});
      updated++;
    }
  }

  return NextResponse.json({ success: true, scanned: list.length, updated });
}
