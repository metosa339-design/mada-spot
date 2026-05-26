'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useTrans } from '@/i18n';

export default function MentionsLegalesPage() {
  const t = useTrans('legalPages');
  const currentYear = new Date().getFullYear();

  const sectionH2 = "text-[20px] sm:text-[24px] font-semibold tracking-[-0.02em] text-[#FAFAFA] mb-3";
  const listClass = "list-disc pl-6 space-y-1.5 text-[#D4D4D8] text-[14px] leading-relaxed max-w-[65ch]";
  const listClassNone = "list-none space-y-1.5 pl-0 text-[#D4D4D8] text-[14px] leading-relaxed max-w-[65ch]";

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Header />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#A1A1AA] hover:text-[#FAFAFA] text-[13px] mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> {t.mlBackHome}
          </Link>

          <p className="text-[11px] uppercase tracking-[0.18em] text-[#FF6B35] mb-3">Document juridique</p>
          <h1 className="text-[32px] sm:text-[40px] font-semibold tracking-[-0.03em] text-[#FAFAFA] mb-2">{t.mlTitle}</h1>
          <p className="text-[12px] font-mono text-[#71717A] mb-10">{t.mlUpdatePrefix} {currentYear}</p>

          <div className="space-y-10 text-[#D4D4D8] [&_p]:text-[#D4D4D8] [&_p]:leading-relaxed [&_p]:text-[14px] [&_p]:max-w-[65ch] [&_strong]:text-[#FAFAFA] [&_strong]:font-semibold [&_code]:text-[#FF6B35] [&_code]:font-mono [&_code]:text-[12px] [&_p.mt-3]:mt-4 [&_section_>_p]:mb-2 [&_section_>_p:last-child]:mb-0">
            <section>
              <h2 className={sectionH2}>{t.ml1Title}</h2>
              <p>{t.ml1Intro}</p>
              <ul className={listClassNone}>
                <li><strong>{t.ml1Company}</strong> {t.ml1CompanyValue}</li>
                <li><strong>{t.ml1Form}</strong> {t.ml1FormValue}</li>
                <li><strong>{t.ml1Address}</strong> {t.ml1AddressValue}</li>
                <li><strong>{t.ml1Email}</strong> <a href="mailto:contact@madaspot.com" className="text-[#FF6B35] hover:underline">contact@madaspot.com</a></li>
                <li><strong>{t.ml1Director}</strong> {t.ml1DirectorValue}</li>
                <li><strong>{t.ml1Activity}</strong> {t.ml1ActivityValue}</li>
              </ul>
            </section>

            <section>
              <h2 className={sectionH2}>{t.ml2Title}</h2>
              <p>{t.ml2Intro}</p>
              <ul className={listClassNone}>
                <li><strong>{t.ml2Host}</strong> {t.ml2HostValue}</li>
                <li><strong>{t.ml2HostAddress}</strong> {t.ml2HostAddressValue}</li>
                <li><strong>{t.ml2HostIp}</strong> {t.ml2HostIpValue}</li>
                <li><strong>{t.ml2HostWeb}</strong> <a href="https://www.ionos.fr" target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] hover:underline">www.ionos.fr</a></li>
              </ul>
              <p className="mt-3"><strong>{t.ml2ThirdServices}</strong></p>
              <ul className={listClass}>
                <li><strong>{t.ml2Db}</strong> {t.ml2DbValue}</li>
                <li><strong>{t.ml2Cdn}</strong> {t.ml2CdnValue}</li>
                <li><strong>{t.ml2Mail}</strong> {t.ml2MailValue}</li>
                <li><strong>{t.ml2Ssl}</strong> {t.ml2SslValue}</li>
                <li><strong>{t.ml2Domain}</strong> {t.ml2DomainValue}</li>
              </ul>
            </section>

            <section>
              <h2 className={sectionH2}>{t.ml3Title}</h2>
              <p>{t.ml3Body1}</p>
              <p>{t.ml3Body2}</p>
              <p>{t.ml3Body3}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.ml4Title}</h2>
              <p>{t.ml4Body1}</p>
              <p><strong>{t.ml4Collected}</strong></p>
              <ul className={listClass}>
                <li>{t.ml4Coll1}</li>
                <li>{t.ml4Coll2}</li>
                <li>{t.ml4Coll3}</li>
                <li>{t.ml4Coll4}</li>
              </ul>
              <p className="mt-3"><strong>{t.ml4Purpose}</strong></p>
              <ul className={listClass}>
                <li>{t.ml4Pur1}</li>
                <li>{t.ml4Pur2}</li>
                <li>{t.ml4Pur3}</li>
                <li>{t.ml4Pur4}</li>
              </ul>
              <p className="mt-3">
                <strong>{t.ml4Retention}</strong> {t.ml4RetentionBody}
              </p>
              <p>
                <strong>{t.ml4Rights}</strong> {t.ml4RightsBody}{' '}
                <a href="mailto:contact@madaspot.com" className="text-[#FF6B35] hover:underline">contact@madaspot.com</a>
              </p>
              <p>
                {t.ml4SeeMore}{' '}
                <Link href="/politique-confidentialite" className="text-[#FF6B35] hover:underline">
                  {t.ml4PolicyLink}
                </Link>.
              </p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.ml5Title}</h2>
              <p>{t.ml5Intro}</p>
              <ul className={listClass}>
                <li><strong>{t.ml5Cookie1}</strong> (<code>mada-spot-session</code>){t.ml5Cookie1Desc}</li>
                <li><strong>{t.ml5Cookie2}</strong>{t.ml5Cookie2Desc}</li>
                <li><strong>{t.ml5Cookie3}</strong>{t.ml5Cookie3Desc}</li>
              </ul>
              <p className="mt-3">
                <strong>{t.ml5NoAds}</strong> {t.ml5NoAdsBody}
              </p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.ml6Title}</h2>
              <p>{t.ml6Intro}</p>
              <ul className={listClass}>
                <li>{t.ml6Li1}</li>
                <li>{t.ml6Li2}</li>
                <li>{t.ml6Li3}</li>
                <li>{t.ml6Li4}</li>
              </ul>
              <p className="mt-3">{t.ml6Body1}</p>
              <p>
                {t.ml6Body2}{' '}
                <Link href="/cgu" className="text-[#FF6B35] hover:underline">{t.ml6CguLink}</Link>.
              </p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.ml7Title}</h2>
              <p>{t.ml7Body}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.ml8Title}</h2>
              <p>{t.ml8Body}</p>
            </section>

            <section>
              <h2 className={sectionH2}>{t.ml9Title}</h2>
              <p>{t.ml9Intro}</p>
              <ul className={listClassNone}>
                <li><strong>{t.ml9Email}</strong> <a href="mailto:contact@madaspot.com" className="text-[#FF6B35] hover:underline">contact@madaspot.com</a></li>
                <li><strong>{t.ml9Form}</strong> <Link href="/contact" className="text-[#FF6B35] hover:underline">{t.ml9FormValue}</Link></li>
                <li><strong>{t.ml9Postal}</strong> {t.ml9PostalValue}</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
