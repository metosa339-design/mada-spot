'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Hotel, UtensilsCrossed, Mountain, Briefcase, ArrowRight,
  BarChart3, Globe, MessageSquare, Star,
  Camera, Clock, Shield, TrendingUp, Users, Zap,
} from 'lucide-react';
import { useTrans } from '@/i18n';

const EASE = [0.16, 1, 0.3, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: EASE },
  }),
};

export default function InscrireEtablissementPage() {
  const t = useTrans('inscrireEtablissement');
  const stats = [
    { value: t.stat1Value, label: t.stat1Label },
    { value: t.stat2Value, label: t.stat2Label },
    { value: t.stat3Value, label: t.stat3Label },
    { value: t.stat4Value, label: t.stat4Label },
  ];
  const steps = [
    { icon: Clock, title: t.step1Title, description: t.step1Desc },
    { icon: Camera, title: t.step2Title, description: t.step2Desc },
    { icon: Globe, title: t.step3Title, description: t.step3Desc },
    { icon: MessageSquare, title: t.step4Title, description: t.step4Desc },
  ];
  const categories = [
    { icon: Hotel, title: t.categoryHotelsTitle, description: t.categoryHotelsDesc },
    { icon: UtensilsCrossed, title: t.categoryRestaurantsTitle, description: t.categoryRestaurantsDesc },
    { icon: Mountain, title: t.categoryAttractionsTitle, description: t.categoryAttractionsDesc },
    { icon: Briefcase, title: t.categoryProvidersTitle, description: t.categoryProvidersDesc },
  ];
  const benefits = [
    { icon: Zap, title: t.benefit1Title, text: t.benefit1Text },
    { icon: BarChart3, title: t.benefit2Title, text: t.benefit2Text },
    { icon: Star, title: t.benefit3Title, text: t.benefit3Text },
    { icon: Shield, title: t.benefit4Title, text: t.benefit4Text },
    { icon: TrendingUp, title: t.benefit5Title, text: t.benefit5Text },
    { icon: Users, title: t.benefit6Title, text: t.benefit6Text },
  ];
  const faqs = [
    { q: t.faq1Q, a: t.faq1A },
    { q: t.faq2Q, a: t.faq2A },
    { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A },
    { q: t.faq5Q, a: t.faq5A },
    { q: t.faq6Q, a: t.faq6A },
  ];
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#FAFAFA]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#0A0A0F] pt-24 sm:pt-32 pb-16 sm:pb-24">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] bg-[#FF6B35] rounded-full blur-[120px] opacity-[0.10] pointer-events-none" />
        <div className="absolute -bottom-32 -right-20 w-[380px] h-[380px] bg-[#FF6B35] rounded-full blur-[120px] opacity-[0.08] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-flex items-center px-3 py-1.5 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-md text-[11px] text-[#FF6B35] font-semibold uppercase tracking-[0.15em] mb-6">
              {t.heroBadge}
            </span>
            <h1 className="text-[32px] sm:text-[44px] lg:text-[56px] font-semibold tracking-[-0.03em] text-[#FAFAFA] mb-6 leading-[1.05]">
              {t.heroTitlePart1} <span className="text-[#FF6B35]">{t.heroBrand}</span>
            </h1>
            <p className="text-[15px] sm:text-[17px] text-[#A1A1AA] mb-8 leading-relaxed max-w-2xl mx-auto">
              {t.heroDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[14px] rounded-lg transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
              >
                {t.heroCta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center bg-[#111114] border border-[#27272A] rounded-xl py-5 px-3">
                <p className="text-[26px] sm:text-[32px] font-semibold font-mono text-[#FAFAFA]">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-[0.15em] text-[#A1A1AA] mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <motion.div
          variants={fadeUp}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-12"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Catégories</p>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#FAFAFA] mb-4">
            {t.categoriesTitle}
          </h2>
          <p className="text-[#A1A1AA] text-[15px] max-w-2xl mx-auto leading-relaxed">
            {t.categoriesSubtitle}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              variants={fadeUp}
              custom={i + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="bg-[#111114] rounded-xl border border-[#27272A] hover:border-[#3F3F46] p-6 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center mb-4">
                <cat.icon className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#FAFAFA] mb-2">{cat.title}</h3>
              <p className="text-[13px] text-[#A1A1AA] leading-relaxed">{cat.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#0F0F14] border-y border-[#27272A]">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-12"
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Processus</p>
            <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#FAFAFA] mb-4">
              {t.stepsTitle}
            </h2>
            <p className="text-[#A1A1AA] text-[15px] max-w-2xl mx-auto leading-relaxed">
              {t.stepsSubtitle}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                custom={i + 1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/25 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-[#FF6B35]" />
                </div>
                <div className="text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[#FF6B35] mb-2">{t.stepLabel} {i + 1}</div>
                <h3 className="text-[16px] font-semibold text-[#FAFAFA] mb-2">{step.title}</h3>
                <p className="text-[13px] text-[#A1A1AA] leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <motion.div
          variants={fadeUp}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-12"
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Avantages</p>
          <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#FAFAFA] mb-4">
            {t.benefitsTitle}
          </h2>
          <p className="text-[#A1A1AA] text-[15px] max-w-2xl mx-auto leading-relaxed">
            {t.benefitsSubtitle}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              variants={fadeUp}
              custom={i + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              className="flex gap-4 p-5 bg-[#111114] rounded-xl border border-[#27272A] hover:border-[#3F3F46] transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center shrink-0">
                <b.icon className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <h3 className="font-semibold text-[#FAFAFA] text-[15px] mb-1">{b.title}</h3>
                <p className="text-[13px] text-[#A1A1AA] leading-relaxed">{b.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#0F0F14] border-y border-[#27272A]">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
          <motion.div
            variants={fadeUp}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="text-center mb-12"
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Questions</p>
            <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-semibold tracking-[-0.03em] text-[#FAFAFA] mb-4">
              {t.faqTitle}
            </h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.details
                key={i}
                variants={fadeUp}
                custom={i + 1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-80px' }}
                className="group bg-[#111114] rounded-xl border border-[#27272A] hover:border-[#3F3F46] overflow-hidden transition-colors"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-[#FAFAFA] text-[14px] hover:text-[#FF6B35] transition-colors list-none">
                  {faq.q}
                  <ArrowRight className="w-4 h-4 rotate-90 group-open:rotate-[270deg] transition-transform shrink-0 ml-4 text-[#A1A1AA]" />
                </summary>
                <div className="px-5 pb-5 text-[13px] text-[#D4D4D8] leading-relaxed">
                  {faq.a}
                </div>
              </motion.details>
            ))}
          </div>

          {/* FAQ JSON-LD */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.map((faq) => ({
                  '@type': 'Question',
                  name: faq.q,
                  acceptedAnswer: { '@type': 'Answer', text: faq.a },
                })),
              }),
            }}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <motion.div
          variants={fadeUp}
          custom={0}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="relative text-center bg-[#111114] border border-[#27272A] rounded-2xl p-8 sm:p-12 overflow-hidden"
        >
          <div className="absolute -top-24 -right-24 w-[300px] h-[300px] bg-[#FF6B35] rounded-full blur-[100px] opacity-[0.10] pointer-events-none" />
          <div className="relative">
            <h2 className="text-[24px] sm:text-[32px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-4">
              {t.finalCtaTitle}
            </h2>
            <p className="text-[#A1A1AA] text-[15px] mb-8 max-w-lg mx-auto leading-relaxed">
              {t.finalCtaText}
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white font-medium text-[14px] rounded-lg transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
            >
              {t.finalCtaButton}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[#71717A] text-[12px] mt-4">
              {t.finalCtaFootnote}
            </p>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
