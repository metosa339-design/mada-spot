'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTrans } from '@/i18n';

interface BlogClientProps {
  articles: any[];
  categories: any[];
  featured: any | undefined;
  rest: any[];
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogClient({ categories, featured, rest }: BlogClientProps) {
  const t = useTrans('blog');

  return (
    <>
      {/* Hero */}
      <section className="relative py-20 md:py-28 px-4 overflow-hidden bg-[#0A0A0F]">
        <div className="absolute -top-32 -left-20 w-[400px] h-[400px] bg-[#FF6B35] rounded-full blur-[120px] opacity-[0.10] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto text-center">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Magazine</p>
          <h1
            className="text-[32px] sm:text-[44px] lg:text-[52px] font-semibold tracking-[-0.03em] text-[#FAFAFA] mb-4"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {t.heroTitle} <span className="text-[#FF6B35]">{t.heroTitleHighlight}</span>
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#A1A1AA] max-w-2xl mx-auto leading-relaxed">
            {t.heroSubtitleMain}
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 mb-10">
          <div className="flex flex-wrap gap-2 justify-center">
            <span className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium bg-[#FF6B35] text-white border border-[#FF6B35]">
              {t.allCategories}
            </span>
            {categories.map((cat: any) => (
              <span
                key={cat.id}
                className="px-3.5 py-1.5 rounded-lg text-[12px] font-medium bg-[#111114] text-[#A1A1AA] hover:text-[#FAFAFA] border border-[#27272A] hover:border-[#3F3F46] transition-colors cursor-pointer"
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
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="mb-12">
            <Link href={`/blog/${featured.slug}`} className="block group">
              <article className="relative rounded-xl overflow-hidden bg-[#111114] border border-[#27272A] hover:border-[#3F3F46] transition-colors">
                <div className="md:flex">
                  <div className="md:w-1/2 relative aspect-[16/10] md:aspect-auto bg-[#1A1A1F]">
                    {featured.imageUrl ? (
                      <Image
                        src={featured.imageUrl}
                        alt={featured.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="w-full h-full min-h-[250px] bg-[#1A1A1F] flex items-center justify-center">
                        <span className="text-4xl opacity-30">·</span>
                      </div>
                    )}
                  </div>
                  <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-[0.1em] bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35]">
                        {t.featuredBadge}
                      </span>
                      {featured.category && (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-[0.1em] bg-[#1A1A1F] border border-[#27272A] text-[#D4D4D8]">
                          {featured.category.name}
                        </span>
                      )}
                    </div>
                    <h2 className="text-[20px] md:text-[26px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-3 group-hover:text-[#FF6B35] transition-colors leading-tight">
                      {featured.title}
                    </h2>
                    <p className="text-[14px] text-[#A1A1AA] mb-4 line-clamp-3 leading-relaxed">
                      {featured.summary || featured.content.substring(0, 200)}
                    </p>
                    <div className="flex items-center gap-2 text-[12px] font-mono text-[#71717A]">
                      <time>{formatDate(featured.publishedAt || featured.createdAt)}</time>
                      <span>·</span>
                      <span>{Math.ceil(featured.content.length / 1500)} {t.minRead}</span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          </motion.div>
        )}

        {/* Articles Grid */}
        {rest.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article: any) => (
              <motion.div key={article.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                <Link href={`/blog/${article.slug}`} className="group block h-full">
                  <article className="h-full rounded-xl overflow-hidden bg-[#111114] border border-[#27272A] hover:border-[#3F3F46] transition-colors">
                    <div className="relative aspect-[16/10] bg-[#1A1A1F]">
                      {article.imageUrl ? (
                        <Image
                          src={article.imageUrl}
                          alt={article.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#1A1A1F] flex items-center justify-center">
                          <span className="text-3xl opacity-30">·</span>
                        </div>
                      )}
                      {article.category && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-[0.1em] backdrop-blur-md bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35]">
                          {article.category.name}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-[#FAFAFA] text-[15px] mb-2 group-hover:text-[#FF6B35] transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-[13px] text-[#A1A1AA] line-clamp-2 mb-3 leading-relaxed">
                        {article.summary || article.content.substring(0, 120)}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717A]">
                        <time>{formatDate(article.publishedAt || article.createdAt)}</time>
                        <span>·</span>
                        <span>{Math.ceil(article.content.length / 1500)} {t.minShort}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : !featured ? (
          <div className="text-center py-20">
            <p className="text-[22px] font-semibold text-[#FAFAFA] mb-2">{t.noArticlesYet}</p>
            <p className="text-[#A1A1AA] text-[13px]">{t.comeBackSoon}</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
