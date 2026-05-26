import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/constants';
import { safeJsonParse } from '@/lib/api-response';
import BlogArticleClient from './BlogArticleClient';

const db = prisma as any;

export const revalidate = 300;

interface Props {
  params: Promise<{ slug: string }>;
}

async function getArticle(slug: string) {
  const article = await db.article.findFirst({
    where: { slug, status: 'published' },
    include: { category: true },
  });
  if (!article) return null;

  const related = await db.article.findMany({
    where: {
      status: 'published',
      id: { not: article.id },
      ...(article.categoryId ? { categoryId: article.categoryId } : {}),
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: { id: true, title: true, slug: true, imageUrl: true, summary: true, content: true, publishedAt: true, createdAt: true },
  });

  return { article, related };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getArticle(slug);
  if (!data) return { title: 'Article non trouvé' };

  const { article } = data;
  const description = article.summary || article.content.substring(0, 160);

  return {
    title: `${article.title} | Blog Mada Spot`,
    description,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: article.title,
      description,
      url: `${SITE_URL}/blog/${slug}`,
      type: 'article',
      publishedTime: (article.publishedAt || article.createdAt).toISOString(),
      ...(article.imageUrl ? { images: [{ url: article.imageUrl, width: 1200, height: 630 }] } : {}),
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const data = await getArticle(slug);
  if (!data) notFound();

  const { article, related } = data;
  const additionalImages = safeJsonParse<string[]>(article.additionalImages, []);
  const readingTime = Math.ceil(article.content.length / 1500);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary || article.content.substring(0, 160),
    image: article.imageUrl || `${SITE_URL}/logo.png`,
    datePublished: (article.publishedAt || article.createdAt).toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: article.sourceName || 'Mada Spot',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Mada Spot',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: `${SITE_URL}/blog/${slug}`,
  };

  return (
    <main className="min-h-screen bg-[#0A0A0F]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogArticleClient
        article={article}
        related={related}
        additionalImages={additionalImages}
        readingTime={readingTime}
      />
    </main>
  );
}
