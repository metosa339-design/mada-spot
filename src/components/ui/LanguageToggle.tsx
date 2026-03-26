'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
      className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-xs font-semibold text-white hover:bg-white/20 transition-colors border border-white/10"
      title={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
    >
      <span className={locale === 'fr' ? 'text-orange-400' : 'text-white/60'}>FR</span>
      <span className="text-white/30">/</span>
      <span className={locale === 'en' ? 'text-orange-400' : 'text-white/60'}>EN</span>
    </button>
  );
}
