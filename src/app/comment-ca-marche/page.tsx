'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AnimatedHero, AnimatedSection, StepsGrid } from './AnimatedSteps';
import { useTrans } from '@/i18n';

export default function CommentCaMarchePage() {
  const t = useTrans('commentCaMarche');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#1a1a24] to-[#0a0a0f] text-white">
      <Header />
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <AnimatedHero>
            <Image src="/logo.png" alt="Mada Spot" width={64} height={64} className="w-16 h-16 mx-auto mb-6 object-contain" />
            <h1 className="text-5xl font-bold mb-6">
              {t.pageTitle} <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">{t.pageTitleHighlight}</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              {t.heroDesc}
            </p>
          </AnimatedHero>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* Section Visiteurs */}
        <AnimatedSection>
          <div className="text-center mb-12">
            <span className="px-4 py-1.5 bg-orange-500/10 text-orange-400 text-sm font-semibold rounded-full">
              {t.visitorsBadge}
            </span>
            <h2 className="text-3xl font-bold mt-4">{t.visitorsTitle}</h2>
            <p className="text-gray-400 mt-2">{t.visitorsSubtitle}</p>
          </div>

          <StepsGrid type="visiteur" />

          <div className="text-center mt-10">
            <Link
              href="/bons-plans"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all"
            >
              {t.exploreDeals}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
      <Footer />
    </div>
  );
}
