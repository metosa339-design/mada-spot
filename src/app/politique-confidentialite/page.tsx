'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTrans } from '@/i18n';

export default function PolitiqueConfidentialitePage() {
  const t = useTrans('legalPages');

  const sectionH2 = "text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-[#0F172A] mb-3";
  const listClass = "list-disc pl-6 space-y-1.5 text-[#334155] text-[14px] leading-relaxed max-w-[65ch]";

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#64748B] hover:text-[#0F172A] text-[13px] mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> {t.back}
          </Link>

          <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Document juridique</p>
          <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.03em] text-[#0F172A] mb-2">{t.pcTitle}</h1>
          <p className="text-[12px] font-mono text-[#94A3B8] mb-10">{t.pcUpdate}</p>

          <div className="space-y-10 [&_p]:text-[#334155] [&_p]:leading-relaxed [&_p]:text-[14px] [&_p]:max-w-[65ch] [&_strong]:text-[#0F172A] [&_strong]:font-semibold [&_section_>_p]:mb-3 [&_section_>_p:last-child]:mb-0">
            <section>
              <h2 className={sectionH2}>{t.pc1Title}</h2>
              <p>{t.pc1Intro}</p>
              <ul className={listClass}>
                <li>{t.pc1Li1}</li>
                <li>{t.pc1Li2}</li>
                <li>{t.pc1Li3}</li>
                <li>{t.pc1Li4}</li>
                <li>{t.pc1Li5}</li>
              </ul>
            </section>

            <section>
              <h2 className={sectionH2}>{t.pc2Title}</h2>
              <p>{t.pc2Intro}</p>
              <ul className={listClass}>
                <li>{t.pc2Li1}</li>
                <li>{t.pc2Li2}</li>
                <li>{t.pc2Li3}</li>
                <li>{t.pc2Li4}</li>
                <li>{t.pc2Li5}</li>
              </ul>
            </section>

            <section>
              <h2 className={sectionH2}>{t.pc3Title}</h2>
              <p>{t.pc3Intro}</p>
              <ul className={listClass}>
                <li>{t.pc3Li1}</li>
                <li>{t.pc3Li2}</li>
                <li>{t.pc3Li3}</li>
              </ul>
            </section>

            <section>
              <h2 className={sectionH2}>{t.pc4Title}</h2>
              <p>{t.pc4Body}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.pc5Title}</h2>
              <p>{t.pc5Intro}</p>
              <ul className={listClass}>
                <li><strong>{t.pc5Right1}</strong> {t.pc5Right1Desc}</li>
                <li><strong>{t.pc5Right2}</strong> {t.pc5Right2Desc}</li>
                <li><strong>{t.pc5Right3}</strong> {t.pc5Right3Desc}</li>
                <li><strong>{t.pc5Right4}</strong> {t.pc5Right4Desc}</li>
              </ul>
              <p>
                {t.pc5Exercise}{' '}
                <Link href="/client/settings" className="text-[#FF6B35] hover:underline">{t.pc5SettingsLink}</Link>{' '}
                {t.pc5OrContact}{' '}
                <a href="mailto:privacy@madaspot.com" className="text-[#FF6B35] hover:underline">privacy@madaspot.com</a>.
              </p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.pc6Title}</h2>
              <p>{t.pc6Intro}</p>
              <ul className={listClass}>
                <li><strong>{t.pc6Cookie1}</strong> {t.pc6Cookie1Desc}</li>
                <li><strong>{t.pc6Cookie2}</strong> {t.pc6Cookie2Desc}</li>
                <li><strong>{t.pc6Cookie3}</strong> {t.pc6Cookie3Desc}</li>
              </ul>
              <p>{t.pc6NoTracking}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.pc7Title}</h2>
              <p>{t.pc7Body}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.pc8Title}</h2>
              <p>
                {t.pc8Body}{' '}
                <a href="mailto:privacy@madaspot.com" className="text-[#FF6B35] hover:underline">privacy@madaspot.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
