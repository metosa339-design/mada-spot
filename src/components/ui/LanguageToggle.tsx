'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();

  return (
    <button
      onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
      className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-full text-xs font-semibold transition-colors"
      title={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
    >
      <span className={locale === 'fr' ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}>FR</span>
      <span className="text-[#CBD5E1]">/</span>
      <span className={locale === 'en' ? 'text-[#FF6B35]' : 'text-[#94A3B8]'}>EN</span>
    </button>
  );
}
