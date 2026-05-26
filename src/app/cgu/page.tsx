'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTrans } from '@/i18n';

export default function CGUPage() {
  const t = useTrans('legalPages');

  const sectionH2 = "text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-3";
  const bodyP = "text-[#D4D4D8] leading-relaxed text-[14px] max-w-[65ch]";
  const listClass = "list-disc pl-6 space-y-1.5 text-[#D4D4D8] text-[14px] leading-relaxed max-w-[65ch]";

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Header />

      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#A1A1AA] hover:text-[#FAFAFA] text-[13px] mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> {t.back}
          </Link>

          <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Document juridique</p>
          <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.03em] text-[#FAFAFA] mb-2">{t.cguTitle}</h1>
          <p className="text-[12px] font-mono text-[#71717A] mb-10">{t.cguUpdate}</p>

          <div className="space-y-10 [&_p]:text-[#D4D4D8] [&_p]:leading-relaxed [&_p]:text-[14px] [&_p]:max-w-[65ch] [&_strong]:text-[#FAFAFA] [&_strong]:font-semibold">
            <section>
              <h2 className={sectionH2}>{t.cgu1Title}</h2>
              <p className={bodyP}>{t.cgu1Body}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.cgu2Title}</h2>
              <p className={bodyP + " mb-3"}>{t.cgu2Intro}</p>
              <ul className={listClass}>
                <li>{t.cgu2Li1}</li>
                <li>{t.cgu2Li2}</li>
                <li>{t.cgu2Li3}</li>
              </ul>
            </section>

            <section>
              <h2 className={sectionH2}>{t.cgu3Title}</h2>
              <p className={bodyP + " mb-3"}>{t.cgu3Body1}</p>
              <p className={bodyP}>{t.cgu3Body2}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.cgu4Title}</h2>
              <p className={bodyP + " mb-3"}>{t.cgu4Intro}</p>
              <ul className={listClass}>
                <li>{t.cgu4Li1}</li>
                <li>{t.cgu4Li2}</li>
                <li>{t.cgu4Li3}</li>
                <li>{t.cgu4Li4}</li>
                <li>{t.cgu4Li5}</li>
              </ul>
            </section>

            <section>
              <h2 className={sectionH2}>{t.cgu5Title}</h2>
              <p className={bodyP + " mb-3"}>{t.cgu5Body1}</p>
              <p className={bodyP}>{t.cgu5Body2}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.cgu6Title}</h2>
              <p className={bodyP}>{t.cgu6Body}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.cgu7Title}</h2>
              <p className={bodyP + " mb-3"}>{t.cgu7Intro}</p>
              <ul className={listClass}>
                <li>{t.cgu7Li1}</li>
                <li>{t.cgu7Li2}</li>
                <li>{t.cgu7Li3}</li>
                <li>{t.cgu7Li4}</li>
              </ul>
            </section>

            <section>
              <h2 className={sectionH2}>{t.cgu8Title}</h2>
              <p className={bodyP}>{t.cgu8Body}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.cgu9Title}</h2>
              <p className={bodyP}>{t.cgu9Body}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.cgu10Title}</h2>
              <p className={bodyP}>{t.cgu10Body}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.cgu11Title}</h2>
              <p className={bodyP}>
                {t.cgu11Body}{' '}
                <a href="mailto:contact@madaspot.com" className="text-[#FF6B35] hover:underline">contact@madaspot.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
