import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { computeCompleteness, hasRealPhoto } from '@/lib/crm/completeness';
import { calculateCompletenessScore, calculateRankScore } from '@/lib/ranking';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// POST /api/cron/recompute-completeness — recalcule complétude (tri public) + rankScore (classement global).
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || new URL(request.url).searchParams.get('secret');
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const list = await prisma.establishment.findMany({
    select: {
      id: true, completenessScore: true, hasRealPhoto: true, rankScore: true, coverImage: true, images: true,
      description: true, shortDescription: true, phone: true, phone2: true, email: true, website: true,
      address: true, latitude: true, longitude: true, city: true, facebook: true, instagram: true, whatsapp: true,
      isVerified: true, rating: true, reviewCount: true, viewCount: true, isFeatured: true,
    },
  });

  let updated = 0;
  for (const e of list) {
    const score = computeCompleteness(e); // 0-100 (tri public, inchangé)
    const photo = hasRealPhoto(e);
    const completeness1000 = calculateCompletenessScore(e).score; // 0-1000
    const rankScore = calculateRankScore(e, completeness1000);
    if (score !== e.completenessScore || photo !== e.hasRealPhoto || Math.abs(rankScore - (e.rankScore || 0)) > 0.5) {
      await prisma.establishment.update({
        where: { id: e.id },
        data: { completenessScore: score, hasRealPhoto: photo, rankScore },
      }).catch(() => {});
      updated++;
    }
  }

  return NextResponse.json({ success: true, scanned: list.length, updated });
}
