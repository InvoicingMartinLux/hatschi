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
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {t.myAllergens}
        </h3>
        <button
          onClick={onSelectAll}
          disabled={allSelected}
          className="text-xs font-medium text-green-700 hover:text-green-800 disabled:text-gray-300 disabled:cursor-default transition-colors"
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all
                ${isOn
                  ? 'bg-green-600 border-green-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'}`}
            >
              <span className={isOn ? '' : 'opacity-50'}>{a.emoji}</span>
              <span>{t.allergens[a.apiField]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
