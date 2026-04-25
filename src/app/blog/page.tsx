import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/db';
import { SITE_URL } from '@/lib/constants';

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

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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
    <main className="min-h-screen bg-[#070710]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative py-16 md:py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />
        <div className="relative max-w-5xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Blog <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">Madagascar</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Guides de voyage, conseils pratiques et bons plans pour explorer Madagascar
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mb-10">
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-4 py-2 rounded-full text-sm font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
              Tous
            </span>
            {categories.map((cat: any) => (
              <span
                key={cat.id}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
              >
                {cat.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* Featured Article */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} className="block mb-12 group">
            <article className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all">
              <div className="md:flex">
                <div className="md:w-1/2 relative aspect-[16/10] md:aspect-auto">
                  {featured.imageUrl ? (
                    <Image
                      src={featured.imageUrl}
                      alt={featured.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full min-h-[250px] bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                      <span className="text-4xl">🏝️</span>
                    </div>
                  )}
                </div>
                <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400">
                      A la une
                    </span>
                    {featured.category && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${featured.category.color || '#ff6b35'}20`, color: featured.category.color || '#ff6b35' }}
                      >
                        {featured.category.name}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-white/60 mb-4 line-clamp-3">
                    {featured.summary || featured.content.substring(0, 200)}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-white/40">
                    <time>{formatDate(featured.publishedAt || featured.createdAt)}</time>
                    <span>·</span>
                    <span>{Math.ceil(featured.content.length / 1500)} min de lecture</span>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Articles Grid */}
        {rest.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article: any) => (
              <Link key={article.id} href={`/blog/${article.slug}`} className="group">
                <article className="h-full rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-orange-500/30 transition-all">
                  <div className="relative aspect-[16/10]">
                    {article.imageUrl ? (
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center">
                        <span className="text-3xl">🏝️</span>
                      </div>
                    )}
                    {article.category && (
                      <span
                        className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm"
                        style={{ backgroundColor: `${article.category.color || '#ff6b35'}cc`, color: '#fff' }}
                      >
                        {article.category.name}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-white/50 line-clamp-2 mb-3">
                      {article.summary || article.content.substring(0, 120)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <time>{formatDate(article.publishedAt || article.createdAt)}</time>
                      <span>·</span>
                      <span>{Math.ceil(article.content.length / 1500)} min</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : !featured ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-xl text-white/60">Aucun article pour le moment</p>
            <p className="text-white/40 mt-2">Revenez bientôt pour des guides et conseils voyage !</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
