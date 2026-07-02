'use client';

import { ALLERGENS, SEVERITIES, type DayForecast, type Severity } from '@/lib/models';
import { formatRelativeLabel, formatWeekday } from '@/lib/pollenApi';
import type { Messages } from '@/lib/i18n';

// Severity → CSS variable stem (palette defined in globals.css). Colors are a
// status encoding and are never the only channel: every column carries its
// value + severity as text (tooltip, focus label) and the legend names them.
const SEV_VAR: Record<string, string> = {
  NONE: 'none',
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'veryhigh',
};

const sevFill = (sev: Severity) => `var(--sev-${SEV_VAR[sev.level]}-fill)`;

/**
 * Small-multiple column charts: one facet per selected allergen, one column
 * per forecast day. Facets are scaled independently because allergens have
 * very different concentration ranges — a shared axis would let birch dwarf
 * grass while both are "high" for sufferers.
 */
export default function AllergenTrends({
  days,
  selectedAllergens,
  selectedDayIndex,
  onSelectDay,
  bcp47,
  t,
}: {
  days: DayForecast[];
  selectedAllergens: Set<string>;
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
  bcp47: string;
  t: Messages;
}) {
  const allergens = ALLERGENS.filter((a) => selectedAllergens.has(a.apiField));
  if (allergens.length === 0 || days.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
        {t.trendTitle}
      </h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {allergens.map((allergen) => {
          const readings = days.map((day) =>
            day.readings.find((r) => r.allergen.apiField === allergen.apiField),
          );
          const values = readings.map((r) => r?.peakValue ?? 0);
          const facetMax = Math.max(...values, 1e-9);
          const maxIndex = values.indexOf(Math.max(...values));

          return (
            <section
              key={allergen.apiField}
              className="rounded-2xl border border-[var(--hairline)] bg-white p-4 shadow-[0_1px_2px_rgba(11,11,11,0.04)]"
            >
              <h4 className="flex items-center gap-1.5 text-sm font-medium text-[var(--ink-primary)]">
                <span aria-hidden>{allergen.emoji}</span>
                <span className="truncate">{t.allergens[allergen.apiField]}</span>
              </h4>

              {/* Plot: columns grow from a shared baseline; the container
                  height includes the x-axis label band below it. */}
              <div className="mt-3 flex items-end gap-2 border-b border-[var(--hairline)]" style={{ height: 84 }}>
                {readings.map((reading, i) => {
                  if (!reading) return <span key={i} className="flex-1" />;
                  const value = reading.peakValue;
                  const sev = reading.severity;
                  const pct = value / facetMax;
                  // ≥4px so a tiny nonzero day stays visible; zero gets a 3px stub.
                  const barHeight = value <= 0 ? 3 : Math.max(4, Math.round(pct * 66));
                  const dayLabel =
                    formatRelativeLabel(days[i].isoDate, bcp47, t.today, t.tomorrow) ||
                    formatWeekday(days[i].isoDate, bcp47);
                  const valueText = `${value.toFixed(1)} ${t.grainsUnit}`;
                  const sevText = t.severityLabel[sev.level];
                  return (
                    <button
                      key={days[i].isoDate}
                      onClick={() => onSelectDay(i)}
                      aria-label={`${dayLabel}: ${valueText}, ${sevText}`}
                      aria-pressed={i === selectedDayIndex}
                      className="group relative flex h-full flex-1 flex-col items-center justify-end outline-none"
                    >
                      {/* Tooltip: value leads, labels follow. Shown on hover and
                          keyboard focus; the same text lives in aria-label. */}
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--ink-primary)] px-2.5 py-1.5 text-center opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                      >
                        <span className="block text-xs font-semibold text-white">{valueText}</span>
                        <span className="block text-[10px] text-white/75">
                          {dayLabel} · {sevText}
                        </span>
                      </span>

                      {/* Selective direct label: only the facet's peak day. */}
                      {i === maxIndex && value > 0 && (
                        <span className="mb-0.5 text-[10px] leading-none text-[var(--ink-muted)]">
                          {Math.round(value)}
                        </span>
                      )}

                      <span
                        className="w-full max-w-6 rounded-t transition-[filter] duration-150 group-hover:brightness-110 group-focus-visible:brightness-110"
                        style={{
                          height: barHeight,
                          backgroundColor: value <= 0 ? 'var(--sev-none-track)' : sevFill(sev),
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* X-axis band */}
              <div className="mt-1.5 flex gap-2">
                {days.map((day, i) => (
                  <span
                    key={day.isoDate}
                    className={`flex-1 text-center text-[10px] leading-tight
                      ${i === selectedDayIndex
                        ? 'font-semibold text-[var(--ink-primary)]'
                        : 'text-[var(--ink-muted)]'}`}
                  >
                    {formatWeekday(day.isoDate, bcp47)}
                  </span>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Severity legend: names every color used above. */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
        {(Object.keys(SEVERITIES) as (keyof typeof SEVERITIES)[]).map((level) => (
          <span key={level} className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-secondary)]">
            <span
              aria-hidden
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: sevFill(SEVERITIES[level]) }}
            />
            {t.severityLabel[level]}
          </span>
        ))}
      </div>
    </div>
  );
}
