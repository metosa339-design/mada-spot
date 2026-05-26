'use client';

import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FAQAccordion from './FAQAccordion';
import { useTrans } from '@/i18n';

export default function FAQPage() {
  const t = useTrans('faq');

  const FAQ_SECTIONS = [
    {
      title: t.sectionGeneral,
      items: [
        { question: t.q1, answer: t.a1 },
        { question: t.q2, answer: t.a2 },
        { question: t.q3, answer: t.a3 },
      ],
    },
    {
      title: t.sectionAccount,
      items: [
        { question: t.q4, answer: t.a4 },
        { question: t.q5, answer: t.a5 },
        { question: t.q6, answer: t.a6 },
      ],
    },
    {
      title: t.sectionBookings,
      items: [
        { question: t.q7, answer: t.a7 },
        { question: t.q8, answer: t.a8 },
      ],
    },
    {
      title: t.sectionReviews,
      items: [
        { question: t.q9, answer: t.a9 },
        { question: t.q10, answer: t.a10 },
      ],
    },
    {
      title: t.sectionSecurity,
      items: [
        { question: t.q11, answer: t.a11 },
        { question: t.q12, answer: t.a12 },
      ],
    },
  ];

  const allItems = FAQ_SECTIONS.flatMap((s) => s.items);
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#F8FAFC] py-16 sm:py-20 pt-28 overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] mb-6 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> {t.backToHome}
            </Link>
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-[#FF6B35]" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] font-semibold">{t.helpCenter}</span>
            </div>
            <h1 className="text-[32px] sm:text-[44px] lg:text-[52px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-4">{t.heroTitle}</h1>
            <p className="text-[15px] sm:text-[17px] text-[#64748B] max-w-2xl leading-relaxed">
              {t.heroSubtitle}
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12 sm:py-16">
          <div className="max-w-3xl mx-auto px-4">
            <FAQAccordion sections={FAQ_SECTIONS} />
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 sm:py-16 bg-[#0F0F14] border-y border-[#E2E8F0]">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-2">{t.notFoundTitle}</h2>
            <p className="text-[#64748B] text-[14px] mb-6 leading-relaxed">
              {t.notFoundText}
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#FF6B35] hover:bg-[#F97316] text-white rounded-lg text-[14px] font-medium transition-all shadow-[0_8px_30px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.35)]"
            >
              {t.contactUs}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
