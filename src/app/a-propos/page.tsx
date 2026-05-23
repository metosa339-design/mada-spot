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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#ff6b35] via-orange-500 to-[#ff1493] text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> {t.back}
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-7 h-7" />
              </div>
              <span className="text-white/80 text-lg">{t.heroEyebrow}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.heroTitle}</h1>
            <p className="text-xl text-white/90 max-w-2xl">
              {t.heroDesc}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4">
            <div className="prose prose-gray max-w-none space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">{t.whyTitle}</h2>
              <p>
                {t.whyPara1}
              </p>
              <p>
                {t.whyPara2Prefix}<strong>{t.whyPara2Brand}</strong>{t.whyPara2Suffix}
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8">{t.moreThanTitle}</h2>
              <p>
                {t.moreThanPara}
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t.valuesTitle}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {VALUES.map((value) => {
                const Icon = value.icon;
                return (
                  <div key={value.key} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <Icon className="w-10 h-10 text-[#ff6b35] mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{t[`${value.key}Title` as const]}</h3>
                    <p className="text-gray-600 text-sm">{t[`${value.key}Desc` as const]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Numbers */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">{t.statsTitle}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="text-3xl font-bold text-[#ff6b35] mb-1">175+</div>
                <div className="text-sm text-gray-600">{t.stat1Label}</div>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="text-3xl font-bold text-[#ff6b35] mb-1">10K+</div>
                <div className="text-sm text-gray-600">{t.stat2Label}</div>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="text-3xl font-bold text-[#ff6b35] mb-1">20+</div>
                <div className="text-sm text-gray-600">{t.stat3Label}</div>
              </div>
              <div className="text-center p-6 bg-white rounded-xl border border-gray-100">
                <div className="text-3xl font-bold text-[#ff6b35] mb-1">50+</div>
                <div className="text-sm text-gray-600">{t.stat4Label}</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-gradient-to-r from-[#1a1a2e] to-[#16213e]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <Heart className="w-10 h-10 text-[#ff6b35] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">{t.ctaTitle}</h2>
            <p className="text-gray-400 mb-6">
              {t.ctaDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/bons-plans"
                className="px-6 py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#e55a2b] transition-colors"
              >
                {t.ctaDeals}
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
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
