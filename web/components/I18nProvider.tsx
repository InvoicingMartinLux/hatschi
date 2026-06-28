'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  detectLocale,
  setStoredLocale,
  TRANSLATIONS,
  type Locale,
  type Messages,
} from '@/lib/i18n';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Start with 'en' for deterministic SSR, then resolve the real locale on mount.
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    // localStorage/navigator are only available on the client; resolving the
    // locale here (after the deterministic 'en' first render) avoids a
    // hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(detectLocale());
  }, []);

  // Keep <html lang> in sync for accessibility / SEO.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    setStoredLocale(next);
  };

  const value: I18nContextValue = {
    locale,
    setLocale,
    t: TRANSLATIONS[locale],
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
