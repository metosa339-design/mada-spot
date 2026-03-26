'use client';

import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useTrans } from '@/i18n';
import {
  Zap,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Heart,
  Loader2,
  CheckCircle,
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
    <footer role="contentinfo" className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
      {/* Newsletter Section */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">
                {t.newsletterTitle}
              </h3>
              <p className="text-gray-400">
                {t.newsletterDesc}
              </p>
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
                  className="flex-1 lg:w-80 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:border-[#ff6b35] disabled:opacity-50"
                />
                <button
                  onClick={handleNewsletter}
                  disabled={nlLoading}
                  className="btn-primary whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
                >
                  {nlLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t.subscribe}
                </button>
              </div>
              {nlMessage && (
                <p className={`mt-2 text-sm flex items-center gap-1 ${nlError ? 'text-red-400' : 'text-green-400'}`}>
                  {!nlError && <CheckCircle className="w-4 h-4" />}
                  {nlMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold">Mada Spot</h4>
                <p className="text-xs text-gray-400">{t.brandDesc}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {t.brandDesc}
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com/madaspot" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 rounded-lg bg-white/10 hover:bg-[#ff6b35] transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/madaspot" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="p-2 rounded-lg bg-white/10 hover:bg-[#ff6b35] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://instagram.com/madaspot" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 rounded-lg bg-white/10 hover:bg-[#ff6b35] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://youtube.com/@madaspot" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2 rounded-lg bg-white/10 hover:bg-[#ff6b35] transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Explorer */}
          <div>
            <h4 className="font-semibold mb-4 text-[#ff6b35]">{t.explore}</h4>
            <ul className="space-y-2">
              <li><a href="/bons-plans/hotels" className="text-sm text-gray-400 hover:text-white transition-colors">{t.hotels}</a></li>
              <li><a href="/bons-plans/restaurants" className="text-sm text-gray-400 hover:text-white transition-colors">{t.restaurants}</a></li>
              <li><a href="/bons-plans/attractions" className="text-sm text-gray-400 hover:text-white transition-colors">{t.attractions}</a></li>
              <li><a href="/bons-plans/carte" className="text-sm text-gray-400 hover:text-white transition-colors">{t.interactiveMap}</a></li>
              <li><a href="/comment-ca-marche" className="text-sm text-gray-400 hover:text-white transition-colors">{t.howItWorks}</a></li>
              <li><a href="/a-propos" className="text-sm text-gray-400 hover:text-white transition-colors">{t.about}</a></li>
              <li><a href="/faq" className="text-sm text-gray-400 hover:text-white transition-colors">{t.faq}</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-[#ff6b35]">{t.contact}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <MapPin className="w-5 h-5 text-[#ff6b35]" />
                <span>Antananarivo, Madagascar</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="w-5 h-5 text-[#ff6b35]" />
                <a href="mailto:contact@madaspot.mg" className="hover:text-white transition-colors">
                  {t.contactEmail}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="w-5 h-5 text-[#ff6b35]" />
                <a href="tel:+261340000000" className="hover:text-white transition-colors">
                  +261 34 00 000 00
                </a>
              </li>
            </ul>

            {/* Download App */}
            <div className="mt-6">
              <p className="text-sm text-gray-400 mb-2">{t.downloadApp}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => toastInfo(t.comingSoon)}
                  aria-label="App Store"
                  className="px-4 py-2 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors"
                >
                  App Store
                </button>
                <button
                  onClick={() => toastInfo(t.comingSoon)}
                  aria-label="Play Store"
                  className="px-4 py-2 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors"
                >
                  Play Store
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <span>© {currentYear} madaspot.mg</span>
              <span>•</span>
              <span>{t.madeWith}</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>{t.inMadagascar}</span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="/mentions-legales" className="hover:text-white transition-colors">{t.legalNotice}</a>
              <a href="/cgu" className="hover:text-white transition-colors">{t.terms}</a>
              <a href="/politique-confidentialite" className="hover:text-white transition-colors">{t.privacy}</a>
              <a href="/contact" className="hover:text-white transition-colors">{t.contact}</a>
            </div>
          </div>

          {/* Mentions légales */}
          <div className="mt-4 p-3 bg-white/5 rounded-lg text-xs text-gray-500 text-center">
            {t.allRights}
          </div>
        </div>
      </div>
    </footer>
  );
}
