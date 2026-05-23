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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <Link href="/" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> {t.backToHome}
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-8 h-8" />
              <span className="text-blue-200 text-lg">{t.helpCenter}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t.heroTitle}</h1>
            <p className="text-xl text-blue-100 max-w-2xl">
              {t.heroSubtitle}
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4">
            <FAQAccordion sections={FAQ_SECTIONS} />
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 bg-white">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t.notFoundTitle}</h2>
            <p className="text-gray-600 mb-4">
              {t.notFoundText}
            </p>
            <Link
              href="/contact"
              className="inline-flex px-6 py-3 bg-[#ff6b35] text-white rounded-xl font-medium hover:bg-[#e55a2b] transition-colors"
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
