'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTrans } from '@/i18n';

export default function PolitiqueConfidentialitePage() {
  const t = useTrans('legalPages');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Link href="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> {t.back}
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.pcTitle}</h1>
          <p className="text-sm text-gray-500 mb-8">{t.pcUpdate}</p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.pc1Title}</h2>
              <p>{t.pc1Intro}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t.pc1Li1}</li>
                <li>{t.pc1Li2}</li>
                <li>{t.pc1Li3}</li>
                <li>{t.pc1Li4}</li>
                <li>{t.pc1Li5}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.pc2Title}</h2>
              <p>{t.pc2Intro}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t.pc2Li1}</li>
                <li>{t.pc2Li2}</li>
                <li>{t.pc2Li3}</li>
                <li>{t.pc2Li4}</li>
                <li>{t.pc2Li5}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.pc3Title}</h2>
              <p>{t.pc3Intro}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>{t.pc3Li1}</li>
                <li>{t.pc3Li2}</li>
                <li>{t.pc3Li3}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.pc4Title}</h2>
              <p>{t.pc4Body}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.pc5Title}</h2>
              <p>{t.pc5Intro}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>{t.pc5Right1}</strong> {t.pc5Right1Desc}</li>
                <li><strong>{t.pc5Right2}</strong> {t.pc5Right2Desc}</li>
                <li><strong>{t.pc5Right3}</strong> {t.pc5Right3Desc}</li>
                <li><strong>{t.pc5Right4}</strong> {t.pc5Right4Desc}</li>
              </ul>
              <p>
                {t.pc5Exercise}{' '}
                <Link href="/client/settings" className="text-orange-500 underline">{t.pc5SettingsLink}</Link>{' '}
                {t.pc5OrContact}{' '}
                <a href="mailto:privacy@madaspot.com" className="text-orange-500 underline">privacy@madaspot.com</a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.pc6Title}</h2>
              <p>{t.pc6Intro}</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>{t.pc6Cookie1}</strong> {t.pc6Cookie1Desc}</li>
                <li><strong>{t.pc6Cookie2}</strong> {t.pc6Cookie2Desc}</li>
                <li><strong>{t.pc6Cookie3}</strong> {t.pc6Cookie3Desc}</li>
              </ul>
              <p>{t.pc6NoTracking}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.pc7Title}</h2>
              <p>{t.pc7Body}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800">{t.pc8Title}</h2>
              <p>
                {t.pc8Body}{' '}
                <a href="mailto:privacy@madaspot.com" className="text-orange-500 underline">privacy@madaspot.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
