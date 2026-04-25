import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/constants';
import { safeJsonParse } from '@/lib/api-response';

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

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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
    <main className="min-h-screen bg-[#070710]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <nav className="flex items-center gap-2 text-sm text-white/40">
          <Link href="/" className="hover:text-white/60 transition-colors">Accueil</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white/60 transition-colors">Blog</Link>
          <span>/</span>
          <span className="text-white/60 truncate">{article.title}</span>
        </nav>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 pt-8 pb-20">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {article.category && (
              <span
                className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: `${article.category.color || '#ff6b35'}20`, color: article.category.color || '#ff6b35' }}
              >
                {article.category.name}
              </span>
            )}
            {article.isBreaking && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400">
                Breaking
              </span>
            )}
          </div>

          <h1 className={`text-2xl md:text-4xl ${article.titleBold ? 'font-black' : 'font-bold'} text-white mb-4 leading-tight`}>
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-lg text-white/60 mb-6">{article.summary}</p>
          )}

          <div className="flex items-center gap-4 text-sm text-white/40 border-b border-white/10 pb-6">
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
                MS
              </span>
              {article.sourceName || 'Mada Spot'}
            </span>
            <time>{formatDate(article.publishedAt || article.createdAt)}</time>
            <span>{readingTime} min de lecture</span>
          </div>
        </header>

        {/* Cover Image */}
        {article.imageUrl && (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert prose-lg max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-white/70 prose-p:leading-relaxed
            prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-strong:font-semibold
            prose-blockquote:border-orange-500 prose-blockquote:text-white/60
            prose-li:text-white/70
            prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Additional Images */}
        {additionalImages.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {additionalImages.map((img: string, i: number) => (
              <div key={i} className="relative aspect-[16/10] rounded-xl overflow-hidden">
                <Image
                  src={img}
                  alt={`${article.title} - Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ))}
          </div>
        )}

        {/* Source */}
        {article.sourceUrl && (
          <p className="mt-8 text-sm text-white/30">
            Source : <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-orange-400/60 hover:underline">{article.sourceName || article.sourceUrl}</a>
          </p>
        )}

        {/* CTA */}
        <div className="mt-12 p-6 md:p-8 rounded-2xl bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Vous avez un etablissement a Madagascar ?</h3>
          <p className="text-white/60 mb-4">Rendez-vous visible gratuitement aupres de milliers de voyageurs.</p>
          <Link
            href="/inscrire-etablissement"
            className="inline-block px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-pink-500 hover:shadow-lg hover:shadow-orange-500/25 transition-all"
          >
            Inscrire mon etablissement gratuitement
          </Link>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">Articles similaires</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r: any) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group">
                  <article className="rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all">
                    <div className="relative aspect-[16/10]">
                      {r.imageUrl ? (
                        <Image
                          src={r.imageUrl}
                          alt={r.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-pink-500/20" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors line-clamp-2">
                        {r.title}
                      </h3>
                      <p className="text-xs text-white/40 mt-2">
                        {formatDate(r.publishedAt || r.createdAt)}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  );
}
