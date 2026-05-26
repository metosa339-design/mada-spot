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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Header />
      {/* Hero */}
      <div className="relative overflow-hidden pt-32 pb-20">

        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <AnimatedHero>
            <Image src="/logo.png" alt="Mada Spot" width={56} height={56} className="w-14 h-14 mx-auto mb-6 object-contain" />
            <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-6">
              {t.pageTitle} <span className="text-[#FF6B35]">{t.pageTitleHighlight}</span>
            </h1>
            <p className="text-[15px] sm:text-[17px] text-[#64748B] max-w-2xl mx-auto leading-relaxed">
              {t.heroDesc}
            </p>
          </AnimatedHero>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        <AnimatedSection>
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">{t.visitorsBadge}</p>
            <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-2">{t.visitorsTitle}</h2>
            <p className="text-[#64748B] text-[15px] max-w-2xl mx-auto leading-relaxed">{t.visitorsSubtitle}</p>
          </div>

          <StepsGrid type="visiteur" />

          <div className="text-center mt-12">
            <Link
              href="/bons-plans"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[14px] rounded-lg transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
            >
              {t.exploreDeals}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
      <Footer />
    </div>
  );
}
