import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { citySlug } from '@/lib/data/cities';

// Nombre d'hôtels publiés par ville (slug normalisé → count).
// Sert à prioriser les destinations populaires (plus d'hôtels = plus grand / en haut).
export const revalidate = 3600;

export async function GET() {
  try {
    const rows = await prisma.establishment.groupBy({
      by: ['city'],
      where: {
        type: 'HOTEL',
        moderationStatus: 'approved',
        isActive: true,
        city: { not: '' },
      },
      _count: { _all: true },
    });
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const slug = citySlug(r.city || '');
      if (!slug) continue;
      counts[slug] = (counts[slug] || 0) + r._count._all;
    }
    return NextResponse.json({ counts });
  } catch {
    return NextResponse.json({ counts: {} });
  }
}
