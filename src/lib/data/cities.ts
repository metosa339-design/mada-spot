import { prisma } from '@/lib/db';

export function citySlug(name: string): string {
  return (name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const EXCLUDE = new Set(['partout-a-madagascar', 'non-specifie', 'autre', '']);
const TYPE_PATH: Record<string, string> = { HOTEL: 'hotels', RESTAURANT: 'restaurants', ATTRACTION: 'attractions', PROVIDER: 'prestataires' };

export interface CityInfo { name: string; slug: string; count: number }

/** Villes distinctes (fusionnées par slug) avec au moins 2 fiches publiées. */
export async function getCities(minCount = 2): Promise<CityInfo[]> {
  const rows = await prisma.establishment.groupBy({
    by: ['city'],
    where: { moderationStatus: 'approved', isActive: true, city: { not: '' } },
    _count: { _all: true },
  });
  const map = new Map<string, CityInfo>();
  for (const r of rows) {
    const name = (r.city || '').trim();
    const slug = citySlug(name);
    if (!name || EXCLUDE.has(slug)) continue;
    const cur = map.get(slug);
    if (cur) { cur.count += r._count._all; if (name.length < cur.name.length) cur.name = name; }
    else map.set(slug, { name, slug, count: r._count._all });
  }
  return [...map.values()].filter((c) => c.count >= minCount).sort((a, b) => b.count - a.count);
}

export async function getCityData(slug: string) {
  const cities = await getCities(1);
  const city = cities.find((c) => c.slug === slug);
  if (!city) return null;

  // Toutes les variantes d'écriture qui donnent ce slug (espaces, accents…)
  const allCities = await prisma.establishment.findMany({
    where: { moderationStatus: 'approved', isActive: true },
    select: { city: true },
    distinct: ['city'],
  });
  const variants = allCities.map((c) => c.city).filter((c): c is string => !!c && citySlug(c) === slug);

  const items = await prisma.establishment.findMany({
    where: { moderationStatus: 'approved', isActive: true, city: { in: variants } },
    select: {
      id: true, name: true, slug: true, type: true, coverImage: true, city: true,
      shortDescription: true, rating: true, reviewCount: true, completenessScore: true,
    },
    orderBy: [{ completenessScore: 'desc' }, { rating: 'desc' }],
    take: 120,
  });

  const byType: Record<string, typeof items> = { HOTEL: [], RESTAURANT: [], ATTRACTION: [], PROVIDER: [] };
  for (const it of items) if (byType[it.type]) byType[it.type].push(it);

  // Articles de blog qui parlent de cette ville
  const articles = await prisma.article
    .findMany({
      where: { status: 'published', OR: [{ title: { contains: city.name, mode: 'insensitive' } }, { content: { contains: city.name, mode: 'insensitive' } }] },
      select: { title: true, slug: true, imageUrl: true },
      take: 3,
    })
    .catch(() => []);

  return { city, byType, total: items.length, articles, typePath: TYPE_PATH };
}
