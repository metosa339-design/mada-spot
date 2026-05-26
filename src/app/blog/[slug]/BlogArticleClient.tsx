'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTrans } from '@/i18n';

interface BlogArticleClientProps {
  article: any;
  related: any[];
  additionalImages: string[];
  readingTime: number;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogArticleClient({ article, related, additionalImages, readingTime }: BlogArticleClientProps) {
  const t = useTrans('blog');

  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-28">
        <nav className="flex items-center gap-2 text-[12px] text-[#71717A]">
          <Link href="/" className="hover:text-[#FAFAFA] transition-colors">{t.breadcrumbHome}</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#FAFAFA] transition-colors">{t.breadcrumbBlog}</Link>
          <span>/</span>
          <span className="text-[#A1A1AA] truncate">{article.title}</span>
        </nav>
      </div>

      {/* Article Header */}
      <article className="max-w-4xl mx-auto px-4 pt-8 pb-20">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {article.category && (
              <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-[0.1em] bg-[#FF6B35]/10 border border-[#FF6B35]/30 text-[#FF6B35]">
                {article.category.name}
              </span>
            )}
            {article.isBreaking && (
              <span className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-[0.1em] bg-red-500/10 border border-red-500/30 text-red-400">
                {t.breakingBadge}
              </span>
            )}
          </div>

          <h1 className="text-[28px] md:text-[40px] font-semibold tracking-[-0.03em] text-[#FAFAFA] mb-4 leading-[1.1]">
            {article.title}
          </h1>

          {article.summary && (
            <p className="text-[16px] sm:text-[18px] text-[#D4D4D8] mb-6 leading-relaxed max-w-[65ch]">{article.summary}</p>
          )}

          <div className="flex items-center gap-4 text-[12px] font-mono text-[#71717A] border-b border-[#27272A] pb-5">
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6B35] to-amber-500 flex items-center justify-center text-white text-[9px] font-semibold font-sans">
                MS
              </span>
              {article.sourceName || 'Mada Spot'}
            </span>
            <time>{formatDate(article.publishedAt || article.createdAt)}</time>
            <span>{readingTime} {t.minRead}</span>
          </div>
        </header>

        {/* Cover Image */}
        {article.imageUrl && (
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-10 border border-[#27272A]">
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
          className="prose prose-invert prose-lg max-w-[65ch]
            prose-headings:text-[#FAFAFA] prose-headings:font-semibold prose-headings:tracking-[-0.02em]
            prose-p:text-[#D4D4D8] prose-p:leading-relaxed
            prose-a:text-[#FF6B35] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-[#FAFAFA] prose-strong:font-semibold
            prose-blockquote:border-[#FF6B35] prose-blockquote:text-[#A1A1AA]
            prose-li:text-[#D4D4D8]
            prose-img:rounded-xl prose-img:border prose-img:border-[#27272A]"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Additional Images */}
        {additionalImages.length > 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            {additionalImages.map((img: string, i: number) => (
              <div key={i} className="relative aspect-[16/10] rounded-xl overflow-hidden border border-[#27272A]">
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
          <p className="mt-8 text-[12px] text-[#71717A]">
            {t.sourceLabel} : <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] hover:underline">{article.sourceName || article.sourceUrl}</a>
          </p>
        )}

        {/* CTA */}
        <div className="mt-12 p-6 md:p-8 rounded-xl bg-[#111114] border border-[#27272A] text-center">
          <h3 className="text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-2">{t.ctaTitle}</h3>
          <p className="text-[#A1A1AA] text-[14px] mb-5 leading-relaxed">{t.ctaDesc}</p>
          <Link
            href="/inscrire-etablissement"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
          >
            {t.ctaBtn}
          </Link>
        </div>

        {/* Related Articles */}
        {related.length > 0 && (
          <section className="mt-16">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">À lire aussi</p>
            <h2 className="text-[22px] sm:text-[28px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-6">{t.relatedArticles}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((r: any) => (
                <motion.div key={r.id} whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <Link href={`/blog/${r.slug}`} className="group block h-full">
                    <article className="rounded-xl overflow-hidden bg-[#111114] border border-[#27272A] hover:border-[#3F3F46] transition-colors h-full">
                      <div className="relative aspect-[16/10] bg-[#1A1A1F]">
                        {r.imageUrl ? (
                          <Image
                            src={r.imageUrl}
                            alt={r.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#1A1A1F]" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-[#FAFAFA] text-[13px] group-hover:text-[#FF6B35] transition-colors line-clamp-2 leading-snug">
                          {r.title}
                        </h3>
                        <p className="text-[11px] font-mono text-[#71717A] mt-2">
                          {formatDate(r.publishedAt || r.createdAt)}
                        </p>
                      </div>
                    </article>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
