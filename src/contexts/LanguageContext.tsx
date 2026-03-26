'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Locale = 'fr' | 'en';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (fr: string | null | undefined, en?: string | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  locale: 'fr',
  setLocale: () => {},
  t: (fr) => fr || '',
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr');

  useEffect(() => {
    const saved = localStorage.getItem('mada-spot-locale') as Locale | null;
    if (saved === 'fr' || saved === 'en') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('mada-spot-locale', newLocale);
  };

  const t = (fr: string | null | undefined, en?: string | null | undefined): string => {
    if (locale === 'en' && en) return en;
    return fr || '';
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
