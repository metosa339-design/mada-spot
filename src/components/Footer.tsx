'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/contexts/ToastContext';
import { useTrans } from '@/i18n';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  MapPin,
  Loader2,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export default function Footer() {
  const t = useTrans('footer');
  const { info: toastInfo } = useToast();
  const currentYear = new Date().getFullYear();
  const [nlEmail, setNlEmail] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlMessage, setNlMessage] = useState('');
  const [nlError, setNlError] = useState(false);

  const handleNewsletter = async () => {
    if (!nlEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nlEmail)) {
      setNlMessage(t.subscribeFail);
      setNlError(true);
      return;
    }
    setNlLoading(true);
    setNlMessage('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nlEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setNlMessage(t.subscribeSuccess);
        setNlError(false);
        setNlEmail('');
      } else {
        setNlMessage(data.error || t.subscribeFail);
        setNlError(true);
      }
    } catch {
      setNlMessage(t.subscribeFail);
      setNlError(true);
    } finally {
      setNlLoading(false);
    }
  };

  return (
    <footer role="contentinfo" className="bg-[#F8FAFC] border-t border-[#E2E8F0] text-[#334155]">
      {/* Newsletter compact */}
      <div className="border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <h3
                className="text-[18px] sm:text-[20px] font-semibold text-[#0F172A] tracking-[-0.01em]"
                style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
              >
                {t.newsletterTitle}
              </h3>
              <p className="text-[13px] text-[#64748B] mt-1">{t.newsletterDesc}</p>
            </div>
            <div className="w-full lg:w-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={t.emailPlaceholder}
                  aria-label={t.emailPlaceholder}
                  value={nlEmail}
                  onChange={(e) => setNlEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNewsletter()}
                  disabled={nlLoading}
                  className="flex-1 lg:w-80 px-3.5 py-2.5 rounded-lg bg-white border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] outline-none focus:border-[#FF6B35]/40 disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={handleNewsletter}
                  disabled={nlLoading}
                  className="px-4 py-2.5 rounded-lg bg-[#FF6B35] hover:bg-[#F97316] text-white text-[13px] font-medium whitespace-nowrap disabled:opacity-50 flex items-center gap-2 shadow-[0_8px_30px_rgba(255,107,53,0.25)] transition-colors"
                >
                  {nlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {t.subscribe}
                </button>
              </div>
              {nlMessage && (
                <p
                  className={`mt-2 text-[12px] flex items-center gap-1 ${nlError ? 'text-[#EF4444]' : 'text-[#10B981]'}`}
                >
                  {!nlError && <CheckCircle className="w-3.5 h-3.5" />}
                  {nlMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Colonnes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Explorer */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#94A3B8] font-semibold mb-4">
              {t.explore}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/hotels" className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors">
                  {t.hotels}
                </Link>
              </li>
              <li>
                <Link href="/restaurants" className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors">
                  {t.restaurants}
                </Link>
              </li>
              <li>
                <Link href="/attractions" className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors">
                  {t.attractions}
                </Link>
              </li>
              <li>
                <Link href="/carte" className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors">
                  {t.interactiveMap}
                </Link>
              </li>
              <li>
                <Link href="/destinations" className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors">
                  Destinations
                </Link>
              </li>
              <li>
                <Link href="/taux-de-change" className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors">
                  Taux de change
                </Link>
              </li>
              <li>
                <Link href="/urgences" className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors">
                  Numéros d&apos;urgence
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Pros */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#94A3B8] font-semibold mb-4">
              {t.contact /* fallback label slot */}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/inscrire-etablissement"
                  className="group inline-flex items-center gap-1.5 text-[13px] text-[#FDBA74] hover:text-[#FF6B35] font-medium transition-colors"
                >
                  {t.registerEstablishment}
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
              <li>
                <Link
                  href="/comment-ca-marche"
                  className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  {t.howItWorks}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors">
                  {t.faq}
                </Link>
              </li>
              <li>
                <Link
                  href="/a-propos"
                  className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  {t.about}
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#94A3B8] font-semibold mb-4">
              {t.legalNotice}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  {t.legalNotice}
                </Link>
              </li>
              <li>
                <Link href="/cgu" className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors">
                  {t.terms}
                </Link>
              </li>
              <li>
                <Link
                  href="/politique-confidentialite"
                  className="text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  {t.privacy}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.1em] text-[#94A3B8] font-semibold mb-4">
              {t.contact}
            </h4>
            <ul className="space-y-3 mb-5">
              <li className="flex items-start gap-2.5 text-[13px] text-[#64748B]">
                <MapPin className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                <span>Ampandrana, Antananarivo 101, Madagascar</span>
              </li>
              <li className="flex items-center gap-2.5 text-[13px] text-[#64748B]">
                <Mail className="w-4 h-4 text-[#94A3B8] shrink-0" />
                <a href="mailto:contact@madaspot.com" className="hover:text-[#0F172A] transition-colors">
                  contact@madaspot.com
                </a>
              </li>
            </ul>

            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#94A3B8] font-semibold mb-2.5">
                {t.downloadApp}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => toastInfo(t.comingSoon)}
                  aria-label="App Store"
                  className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-md text-[11px] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors"
                >
                  App Store
                </button>
                <button
                  onClick={() => toastInfo(t.comingSoon)}
                  aria-label="Play Store"
                  className="px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-md text-[11px] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors"
                >
                  Play Store
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Mada Spot" width={28} height={28} className="w-7 h-7 object-contain" />
              <div>
                <p
                  className="text-[13px] font-semibold text-[#0F172A]"
                  style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
                >
                  Mada<span className="text-[#FF6B35]">Spot</span>
                </p>
                <p className="text-[11px] text-[#94A3B8]">© {currentYear} · {t.allRights}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://facebook.com/madaspot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-8 h-8 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com/madaspot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="w-8 h-8 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com/madaspot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://youtube.com/@madaspot"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-md bg-white border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
