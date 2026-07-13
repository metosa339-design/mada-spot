import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/constants';
import { getCities } from '@/lib/data/cities';

const db = prisma as any;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/bons-plans`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/restaurants`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/hotels`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/attractions`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/prestataires`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/offres`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/carte`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/guide-culinaire`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/a-propos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/inscrire-etablissement`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/comment-ca-marche`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/cgu`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/mentions-legales`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/politique-confidentialite`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/destinations`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // Pages dynamiques — Establishments (hotels, restaurants, attractions)
  const establishments = await prisma.establishment.findMany({
    where: { isActive: true, moderationStatus: 'approved' },
    select: { slug: true, type: true, updatedAt: true },
  });

  const typeToPath: Record<string, string> = {
    RESTAURANT: 'restaurants',
    HOTEL: 'hotels',
    ATTRACTION: 'attractions',
    PROVIDER: 'prestataires',
  };

  const establishmentPages: MetadataRoute.Sitemap = establishments
    .filter((e) => typeToPath[e.type])
    .map((e) => ({
      url: `${SITE_URL}/${typeToPath[e.type]}/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  // Blog articles
  const articles = await db.article.findMany({
    where: { status: 'published' },
    select: { slug: true, updatedAt: true },
  });

  const articlePages: MetadataRoute.Sitemap = articles.map((a: any) => ({
    url: `${SITE_URL}/blog/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Pages destinations (villes)
  const cities = await getCities();
  const cityPages: MetadataRoute.Sitemap = cities.map((c) => ({
    url: `${SITE_URL}/destinations/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [...staticPages, ...establishmentPages, ...articlePages, ...cityPages];
}
