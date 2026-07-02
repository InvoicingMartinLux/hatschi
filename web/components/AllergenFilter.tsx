'use client';

import { ALLERGENS } from '@/lib/models';
import { useI18n } from './I18nProvider';

export default function AllergenFilter({
  selected,
  onToggle,
  onSelectAll,
}: {
  selected: Set<string>;
  onToggle: (apiField: string) => void;
  onSelectAll: () => void;
}) {
  const { t } = useI18n();
  const allSelected = selected.size === ALLERGENS.length;

  return (
    <div className="mt-5">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
          {t.myAllergens}
        </h3>
        <button
          onClick={onSelectAll}
          disabled={allSelected}
          className="text-xs font-medium text-[var(--brand-deep)] transition-colors hover:text-[var(--brand)] disabled:cursor-default disabled:text-[var(--ink-muted)] disabled:opacity-50"
        >
          {t.selectAll}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {ALLERGENS.map((a) => {
          const isOn = selected.has(a.apiField);
          return (
            <button
              key={a.apiField}
              onClick={() => onToggle(a.apiField)}
              aria-pressed={isOn}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all
                ${isOn
                  ? 'bg-[var(--brand-deep)] text-white shadow-[0_2px_8px_rgba(5,150,105,0.25)]'
                  : 'bg-white/60 text-[var(--ink-muted)] ring-1 ring-[var(--hairline)] hover:bg-white hover:text-[var(--ink-secondary)]'}`}
            >
              <span aria-hidden className={isOn ? '' : 'opacity-45 grayscale'}>{a.emoji}</span>
              <span>{t.allergens[a.apiField]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
