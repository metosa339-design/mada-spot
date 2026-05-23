'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Hotel, UtensilsCrossed, Mountain, Briefcase, ArrowRight,
  BarChart3, Globe, MessageSquare, Star,
  Camera, Clock, Shield, TrendingUp, Users, Zap,
} from 'lucide-react';
import { useTrans } from '@/i18n';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
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
    { icon: Hotel, title: t.categoryHotelsTitle, description: t.categoryHotelsDesc, gradient: 'from-blue-500 to-cyan-500' },
    { icon: UtensilsCrossed, title: t.categoryRestaurantsTitle, description: t.categoryRestaurantsDesc, gradient: 'from-orange-500 to-red-500' },
    { icon: Mountain, title: t.categoryAttractionsTitle, description: t.categoryAttractionsDesc, gradient: 'from-green-500 to-emerald-500' },
    { icon: Briefcase, title: t.categoryProvidersTitle, description: t.categoryProvidersDesc, gradient: 'from-purple-500 to-pink-500' },
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
    <div className="min-h-screen bg-[#FDFBF7] text-[#2D241E]">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1a24] via-[#0a0a0f] to-[#1a1a24] text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,#ff6b35_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,#ff1493_0%,transparent_50%)]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full text-sm text-orange-300 font-medium mb-6">
              {t.heroBadge}
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
              {t.heroTitlePart1}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">
                {t.heroBrand}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed">
              {t.heroDesc}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl text-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all"
              >
                {t.heroCta}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-orange-400">{stat.value}</p>
                <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t.categoriesTitle}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t.categoriesSubtitle}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              variants={fadeUp} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-white rounded-2xl border border-[#E8E0D4] p-6 hover:shadow-lg transition-shadow"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center mb-4`}>
                <cat.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">{cat.title}</h3>
              <p className="text-sm text-gray-600">{cat.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-[#E8E0D4]">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t.stepsTitle}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t.stepsSubtitle}
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-orange-500" />
                </div>
                <div className="text-sm font-bold text-orange-500 mb-2">{t.stepLabel} {i + 1}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t.benefitsTitle}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t.benefitsSubtitle}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              variants={fadeUp} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="flex gap-4 p-5 bg-white rounded-xl border border-[#E8E0D4]"
            >
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <b.icon className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold mb-1">{b.title}</h3>
                <p className="text-sm text-gray-600">{b.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Schema + Section */}
      <section className="bg-white border-y border-[#E8E0D4]">
        <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20">
          <motion.div variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">{t.faqTitle}</h2>
          </motion.div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.details
                key={i}
                variants={fadeUp} custom={i + 1} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="group bg-[#FDFBF7] rounded-xl border border-[#E8E0D4] overflow-hidden"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-[#2D241E] hover:text-orange-600 transition-colors">
                  {faq.q}
                  <ArrowRight className="w-4 h-4 rotate-90 group-open:rotate-[270deg] transition-transform shrink-0 ml-4" />
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">
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
          variants={fadeUp} custom={0} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-[#1a1a24] to-[#0a0a0f] rounded-3xl p-8 sm:p-12 text-white"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            {t.finalCtaTitle}
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            {t.finalCtaText}
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl text-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all"
          >
            {t.finalCtaButton}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-gray-500 text-sm mt-4">
            {t.finalCtaFootnote}
          </p>
        </motion.div>
      </section>
    </div>
  );
}
