'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold transition-colors"
      title={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
    >
      <span className={locale === 'fr' ? 'text-[#FF6B35]' : 'text-slate-500'}>FR</span>
      <span className="text-slate-300">/</span>
      <span className={locale === 'en' ? 'text-[#FF6B35]' : 'text-slate-500'}>EN</span>
    </button>
  );
}
