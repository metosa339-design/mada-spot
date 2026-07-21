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

  const linkCls = 'text-[13px] text-slate-400 hover:text-white transition-colors';
  const colTitleCls = 'text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4';
  const socialCls =
    'w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-colors';

  return (
    <footer role="contentinfo" className="bg-[#0F172A] text-slate-400">
      {/* Newsletter compact */}
      <div className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <h3
                className="text-[18px] sm:text-[20px] font-semibold text-white tracking-[-0.01em]"
                style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
              >
                {t.newsletterTitle}
              </h3>
              <p className="text-[13px] text-slate-400 mt-1">{t.newsletterDesc}</p>
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
                  className="flex-1 lg:w-80 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-[14px] text-white placeholder:text-slate-500 outline-none focus:border-[#FF6B35]/50 disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={handleNewsletter}
                  disabled={nlLoading}
                  className="px-4 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-[13px] font-semibold whitespace-nowrap disabled:opacity-50 flex items-center gap-2 hover:scale-[1.02] active:scale-100 transition-all"
                >
                  {nlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {t.subscribe}
                </button>
              </div>
              {nlMessage && (
                <p
                  className={`mt-2 text-[12px] flex items-center gap-1 ${nlError ? 'text-red-400' : 'text-emerald-400'}`}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Explorer */}
          <div>
            <h4 className={colTitleCls}>{t.explore}</h4>
            <ul className="space-y-2.5">
              <li><Link href="/hotels" className={linkCls}>{t.hotels}</Link></li>
              <li><Link href="/restaurants" className={linkCls}>{t.restaurants}</Link></li>
              <li><Link href="/attractions" className={linkCls}>{t.attractions}</Link></li>
              <li><Link href="/carte" className={linkCls}>{t.interactiveMap}</Link></li>
              <li><Link href="/destinations" className={linkCls}>Destinations</Link></li>
              <li><Link href="/taux-de-change" className={linkCls}>Taux de change</Link></li>
              <li><Link href="/urgences" className={linkCls}>Numéros d&apos;urgence</Link></li>
              <li><Link href="/blog" className={linkCls}>Blog</Link></li>
            </ul>
          </div>

          {/* Pros */}
          <div>
            <h4 className={colTitleCls}>{t.contact /* fallback label slot */}</h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/inscrire-etablissement"
                  className="group inline-flex items-center gap-1.5 text-[13px] text-[#FF6B35] hover:text-[#ff8659] font-medium transition-colors"
                >
                  {t.registerEstablishment}
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
              <li><Link href="/comment-ca-marche" className={linkCls}>{t.howItWorks}</Link></li>
              <li><Link href="/faq" className={linkCls}>{t.faq}</Link></li>
              <li><Link href="/a-propos" className={linkCls}>{t.about}</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h4 className={colTitleCls}>{t.legalNotice}</h4>
            <ul className="space-y-2.5">
              <li><Link href="/mentions-legales" className={linkCls}>{t.legalNotice}</Link></li>
              <li><Link href="/cgu" className={linkCls}>{t.terms}</Link></li>
              <li><Link href="/politique-confidentialite" className={linkCls}>{t.privacy}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className={colTitleCls}>{t.contact}</h4>
            <ul className="space-y-3 mb-5">
              <li className="flex items-start gap-2.5 text-[13px] text-slate-400">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>Ampandrana, Antananarivo 101, Madagascar</span>
              </li>
              <li className="flex items-center gap-2.5 text-[13px] text-slate-400">
                <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                <a href="mailto:contact@madaspot.com" className="hover:text-white transition-colors">
                  contact@madaspot.com
                </a>
              </li>
            </ul>

            <div>
              <p className={colTitleCls.replace('mb-4', 'mb-2.5')}>{t.downloadApp}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => toastInfo(t.comingSoon)}
                  aria-label="App Store"
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                >
                  App Store
                </button>
                <button
                  onClick={() => toastInfo(t.comingSoon)}
                  aria-label="Play Store"
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                >
                  Play Store
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Mada Spot" width={28} height={28} className="w-7 h-7 object-contain" />
              <div>
                <p
                  className="text-[13px] font-semibold text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif" }}
                >
                  Mada<span className="text-[#FF6B35]">Spot</span>
                </p>
                <p className="text-[11px] text-slate-500">© {currentYear} · {t.allRights}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a href="https://facebook.com/madaspot" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={socialCls}>
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com/madaspot" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className={socialCls}>
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/madaspot" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={socialCls}>
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com/@madaspot" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className={socialCls}>
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
