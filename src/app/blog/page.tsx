import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/constants';
import BlogClient from './BlogClient';

const db = prisma as any;

export const metadata: Metadata = {
  title: 'Blog Madagascar - Conseils voyage, guides et actualités | Mada Spot',
  description: 'Découvrez nos articles sur Madagascar : guides de voyage, meilleurs hôtels, restaurants, activités et conseils pratiques pour préparer votre séjour.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    title: 'Blog Madagascar - Guides & Conseils voyage | Mada Spot',
    description: 'Guides de voyage, meilleurs hôtels, restaurants et activités à Madagascar.',
    url: `${SITE_URL}/blog`,
    type: 'website',
  },
};

export const revalidate = 300; // ISR 5 min

async function getArticles() {
  const [articles, categories] = await Promise.all([
    db.article.findMany({
      where: { status: 'published' },
      include: { category: true },
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      take: 50,
    }),
    db.articleCategory.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
  ]);
  return { articles, categories };
}

export default async function BlogPage() {
  const { articles, categories } = await getArticles();
  const featured = articles.find((a: any) => a.isFeatured);
  const rest = articles.filter((a: any) => a.id !== featured?.id);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog Mada Spot',
    description: 'Guides de voyage et actualités sur Madagascar',
    url: `${SITE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'Mada Spot',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogClient articles={articles} categories={categories} featured={featured} rest={rest} />
    </main>
  );
}
