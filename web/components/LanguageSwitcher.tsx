'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from './I18nProvider';
import { LOCALE_FLAGS, LOCALE_NAMES, SUPPORTED_LOCALES } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t.language}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[var(--ink-secondary)] transition-colors hover:bg-[var(--brand-tint)] hover:text-[var(--brand-deep)]"
      >
        <span className="text-base leading-none" aria-hidden>{LOCALE_FLAGS[locale]}</span>
        <span className="uppercase tracking-wide">{locale}</span>
        <svg
          className={`h-3.5 w-3.5 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-white py-1.5 shadow-[0_12px_32px_rgba(11,11,11,0.12)]"
        >
          {SUPPORTED_LOCALES.map((loc) => (
            <li key={loc}>
              <button
                role="option"
                aria-selected={loc === locale}
                onClick={() => {
                  setLocale(loc);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors
                  ${loc === locale
                    ? 'bg-[var(--brand-tint)] font-semibold text-[var(--brand-deep)]'
                    : 'text-[var(--ink-secondary)] hover:bg-black/[0.03]'}`}
              >
                <span className="text-base leading-none" aria-hidden>{LOCALE_FLAGS[loc]}</span>
                <span>{LOCALE_NAMES[loc]}</span>
                {loc === locale && (
                  <svg className="ml-auto h-4 w-4 text-[var(--brand)]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
