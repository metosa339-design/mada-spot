'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTrans } from '@/i18n';

export default function CGUPage() {
  const t = useTrans('legalPages');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link href="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> {t.back}
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.cguTitle}</h1>
          <p className="text-sm text-gray-500 mb-8">{t.cguUpdate}</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.cgu1Title}</h2>
              <p>{t.cgu1Body}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.cgu2Title}</h2>
              <p>{t.cgu2Intro}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t.cgu2Li1}</li>
                <li>{t.cgu2Li2}</li>
                <li>{t.cgu2Li3}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.cgu3Title}</h2>
              <p>{t.cgu3Body1}</p>
              <p>{t.cgu3Body2}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.cgu4Title}</h2>
              <p>{t.cgu4Intro}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t.cgu4Li1}</li>
                <li>{t.cgu4Li2}</li>
                <li>{t.cgu4Li3}</li>
                <li>{t.cgu4Li4}</li>
                <li>{t.cgu4Li5}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.cgu5Title}</h2>
              <p>{t.cgu5Body1}</p>
              <p>{t.cgu5Body2}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.cgu6Title}</h2>
              <p>{t.cgu6Body}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.cgu7Title}</h2>
              <p>{t.cgu7Intro}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t.cgu7Li1}</li>
                <li>{t.cgu7Li2}</li>
                <li>{t.cgu7Li3}</li>
                <li>{t.cgu7Li4}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.cgu8Title}</h2>
              <p>{t.cgu8Body}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.cgu9Title}</h2>
              <p>{t.cgu9Body}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.cgu10Title}</h2>
              <p>{t.cgu10Body}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.cgu11Title}</h2>
              <p>
                {t.cgu11Body}{' '}
                <a href="mailto:contact@madaspot.com" className="text-orange-500 underline">contact@madaspot.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
