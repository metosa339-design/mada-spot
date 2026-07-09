import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/api/admin-auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface CalItem {
  type: 'article' | 'event' | 'promotion' | 'campaign' | 'boost';
  date: string;
  title: string;
  status?: string;
  description?: string | null;
  city?: string | null;
  image?: string | null;
  link?: string | null;
}

// GET /api/admin/crm/calendar — calendrier éditorial unifié
export async function GET(request: NextRequest) {
  const admin = await checkAdminAuth(request);
  if (!admin) return apiError('Non autorisé', 401);

  const sp = new URL(request.url).searchParams;
  const from = sp.get('from') ? new Date(sp.get('from')!) : new Date(Date.now() - 30 * 86400000);
  const to = sp.get('to') ? new Date(sp.get('to')!) : new Date(Date.now() + 60 * 86400000);

  const [articles, events, promos, campaigns, boosts] = await Promise.all([
    prisma.article.findMany({
      where: { OR: [{ publishedAt: { gte: from, lte: to } }, { createdAt: { gte: from, lte: to } }] },
      select: { title: true, status: true, publishedAt: true, createdAt: true, slug: true },
      take: 200,
    }),
    prisma.event.findMany({
      where: { startDate: { gte: from, lte: to } },
      select: { title: true, status: true, startDate: true, slug: true, description: true, city: true, coverImage: true },
      take: 200,
    }),
    prisma.promotion.findMany({
      where: { startDate: { gte: from, lte: to } },
      select: { title: true, isActive: true, startDate: true, description: true },
      take: 200,
    }),
    prisma.campaign.findMany({
      where: { OR: [{ sentAt: { gte: from, lte: to } }, { createdAt: { gte: from, lte: to } }] },
      select: { name: true, status: true, sentAt: true, createdAt: true },
      take: 200,
    }),
    prisma.boost.findMany({
      where: { startDate: { gte: from, lte: to } },
      select: { establishmentName: true, status: true, startDate: true },
      take: 200,
    }),
  ]);

  const items: CalItem[] = [];
  for (const a of articles) items.push({ type: 'article', date: (a.publishedAt || a.createdAt).toISOString(), title: a.title, status: a.status, link: `https://madaspot.com/blog/${a.slug}` });
  for (const e of events) items.push({ type: 'event', date: e.startDate.toISOString(), title: e.title, status: e.status, description: e.description, city: e.city, image: e.coverImage, link: `https://madaspot.com/evenements/${e.slug}` });
  for (const p of promos) items.push({ type: 'promotion', date: p.startDate.toISOString(), title: p.title, status: p.isActive ? 'active' : 'inactive', description: p.description, link: 'https://madaspot.com/offres' });
  for (const c of campaigns) items.push({ type: 'campaign', date: (c.sentAt || c.createdAt).toISOString(), title: c.name, status: c.status });
  for (const b of boosts) items.push({ type: 'boost', date: b.startDate.toISOString(), title: b.establishmentName || 'Boost', status: b.status });

  items.sort((a, b) => (a.date < b.date ? 1 : -1));

  return apiSuccess({ from: from.toISOString(), to: to.toISOString(), count: items.length, items });
}
