'use client';

import Link from 'next/link';
import { ArrowLeft, Zap, Target, Users, Heart, Globe, Shield, type LucideIcon } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTrans } from '@/i18n';

type ValueKey = 'value1' | 'value2' | 'value3' | 'value4';
const VALUES: { key: ValueKey; icon: LucideIcon }[] = [
  { key: 'value1', icon: Target },
  { key: 'value2', icon: Globe },
  { key: 'value3', icon: Users },
  { key: 'value4', icon: Shield },
];

export default function AProposPage() {
  const t = useTrans('aPropos');

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#0A0A0F] py-16 sm:py-20 pt-28 overflow-hidden">
          <div className="absolute -top-32 -left-20 w-[400px] h-[400px] bg-[#FF6B35] rounded-full blur-[120px] opacity-[0.10] pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-[350px] h-[350px] bg-[#FF6B35] rounded-full blur-[120px] opacity-[0.08] pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[#A1A1AA] hover:text-[#FAFAFA] text-[13px] mb-6 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> {t.back}
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/25 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] font-semibold">{t.heroEyebrow}</span>
            </div>
            <h1 className="text-[32px] sm:text-[44px] lg:text-[52px] font-semibold tracking-[-0.03em] text-[#FAFAFA] mb-4">{t.heroTitle}</h1>
            <p className="text-[15px] sm:text-[17px] text-[#A1A1AA] max-w-2xl leading-relaxed">
              {t.heroDesc}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-12 sm:py-16">
          <div className="max-w-3xl mx-auto px-4">
            <div className="space-y-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Notre histoire</p>
                <h2 className="text-[24px] sm:text-[30px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-5">{t.whyTitle}</h2>
                <div className="space-y-4 text-[#D4D4D8] leading-relaxed text-[15px] max-w-[65ch]">
                  <p>{t.whyPara1}</p>
                  <p>
                    {t.whyPara2Prefix}<strong className="text-[#FAFAFA] font-semibold">{t.whyPara2Brand}</strong>{t.whyPara2Suffix}
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Notre ambition</p>
                <h2 className="text-[24px] sm:text-[30px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-5">{t.moreThanTitle}</h2>
                <p className="text-[#D4D4D8] leading-relaxed text-[15px] max-w-[65ch]">
                  {t.moreThanPara}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-12 sm:py-16 bg-[#0F0F14] border-y border-[#27272A]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Convictions</p>
              <h2 className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.03em] text-[#FAFAFA]">{t.valuesTitle}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              {VALUES.map((value) => {
                const Icon = value.icon;
                return (
                  <div key={value.key} className="bg-[#111114] rounded-xl p-6 border border-[#27272A] hover:border-[#3F3F46] transition-colors">
                    <div className="w-11 h-11 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-[#FF6B35]" />
                    </div>
                    <h3 className="text-[16px] font-semibold text-[#FAFAFA] mb-2">{t[`${value.key}Title` as const]}</h3>
                    <p className="text-[13px] text-[#A1A1AA] leading-relaxed">{t[`${value.key}Desc` as const]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Numbers */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Mada Spot en chiffres</p>
              <h2 className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.03em] text-[#FAFAFA]">{t.statsTitle}</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
              {[
                { value: '175+', label: t.stat1Label },
                { value: '10K+', label: t.stat2Label },
                { value: '20+', label: t.stat3Label },
                { value: '50+', label: t.stat4Label },
              ].map((s) => (
                <div key={s.label} className="text-center py-6 px-3 bg-[#111114] rounded-xl border border-[#27272A]">
                  <div className="text-[28px] sm:text-[32px] font-semibold font-mono text-[#FAFAFA] mb-1">{s.value}</div>
                  <div className="text-[11px] uppercase tracking-[0.15em] text-[#A1A1AA]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-16 bg-[#0F0F14] border-y border-[#27272A]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <Heart className="w-8 h-8 text-[#FF6B35] mx-auto mb-4" />
            <h2 className="text-[24px] sm:text-[30px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-4">{t.ctaTitle}</h2>
            <p className="text-[#A1A1AA] text-[15px] mb-6 leading-relaxed">
              {t.ctaDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/bons-plans"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
              >
                {t.ctaDeals}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#111114] hover:bg-[#1A1A1F] text-[#FAFAFA] rounded-lg text-[14px] font-medium border border-[#27272A] hover:border-[#3F3F46] transition-colors"
              >
                {t.ctaRegister}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
