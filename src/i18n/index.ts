import { useLanguage } from '@/contexts/LanguageContext';
import { fr, type TranslationSection, type Translations } from './translations/fr';
import { en } from './translations/en';

const dictionaries: Record<string, Translations> = { fr, en };

/**
 * Hook pour accéder aux traductions d'une section donnée.
 *
 * @example
 * const t = useTrans('header');
 * <span>{t.news}</span>
 */
export function useTrans<S extends TranslationSection>(section: S): Translations[S] {
  const { locale } = useLanguage();
  const dict = dictionaries[locale] || fr;
  return dict[section];
}

export { fr, en };
export type { Translations, TranslationSection };
