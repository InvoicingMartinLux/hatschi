'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchForecast, formatRelativeLabel, formatWeekday, searchLocations } from '@/lib/pollenApi';
import {
  ALL_ALLERGEN_FIELDS,
  displayName,
  overallSeverityOf,
  type AllergenReading,
  type DayForecast,
  type ForecastResult,
  type GeoLocation,
  type Severity,
} from '@/lib/models';
import { useI18n } from './I18nProvider';
import { LOCALE_BCP47, type Messages } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import AllergenFilter from './AllergenFilter';

// ─── Persistence ────────────────────────────────────────────────────────────

function saveLocation(loc: GeoLocation) {
  try { localStorage.setItem('allergyradar_location', JSON.stringify(loc)); } catch {}
}
function loadLocation(): GeoLocation | null {
  try {
    const raw = localStorage.getItem('allergyradar_location');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveAllergens(fields: string[]) {
  try { localStorage.setItem('allergyradar_allergens', JSON.stringify(fields)); } catch {}
}
function loadAllergens(): string[] | null {
  try {
    const raw = localStorage.getItem('allergyradar_allergens');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    // Keep only fields that still exist in the current allergen set.
    const valid = parsed.filter((f) => ALL_ALLERGEN_FIELDS.includes(f));
    return valid;
  } catch { return null; }
}

// ─── Severity styling ────────────────────────────────────────────────────────
// Status palette lives in globals.css as CSS variables. Color never carries
// meaning alone here — every colored element is paired with a text label.

const SEV_VAR: Record<string, string> = {
  NONE: 'none',
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  VERY_HIGH: 'veryhigh',
};

function sevStyle(sev: Severity) {
  const v = SEV_VAR[sev.level];
  return {
    fill: `var(--sev-${v}-fill)`,
    track: `var(--sev-${v}-track)`,
    tint: `var(--sev-${v}-tint)`,
    ink: `var(--sev-${v}-ink)`,
  };
}

/** Meter fill as a percentage of the 5-level scale. */
function severityPercent(sev: Severity): number {
  return sev.ordinal * 25;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SeverityDot({ sev, size = 10 }: { sev: Severity; size?: number }) {
  return (
    <span
      aria-hidden
      className="inline-block rounded-full ring-2 ring-white"
      style={{ width: size, height: size, backgroundColor: sevStyle(sev).fill }}
    />
  );
}

function OverallRiskCard({
  readings,
  t,
}: {
  readings: AllergenReading[];
  t: Messages;
}) {
  const sev = overallSeverityOf(readings);
  const s = sevStyle(sev);
  const active = readings
    .filter((r) => r.severity.level !== 'NONE')
    .sort((a, b) => b.severity.ordinal - a.severity.ordinal);
  return (
    <section
      className="rounded-3xl p-6 sm:p-7 border"
      style={{ backgroundColor: s.tint, borderColor: s.track }}
    >
      <div className="flex items-center gap-2">
        <SeverityDot sev={sev} />
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: s.ink }}
        >
          {t.overallRisk}
        </span>
      </div>
      <p
        className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight"
        style={{ color: s.ink }}
      >
        {t.severityLabel[sev.level]}
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--ink-secondary)]">
        {t.severityAdvice[sev.level]}
      </p>
      {active.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {active.slice(0, 3).map((r) => (
            <span
              key={r.allergen.apiField}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/80 pl-2.5 pr-3 py-1.5 text-xs font-medium text-[var(--ink-secondary)]"
            >
              <span aria-hidden>{r.allergen.emoji}</span>
              {t.allergens[r.allergen.apiField]}
              <SeverityDot sev={r.severity} size={7} />
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function AllergenCard({ reading, t }: { reading: AllergenReading; t: Messages }) {
  const sev = reading.severity;
  const s = sevStyle(sev);
  return (
    <div className="rounded-2xl border border-[var(--hairline)] bg-white p-4 shadow-[0_1px_2px_rgba(11,11,11,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(11,11,11,0.07)]">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-xl text-lg"
          style={{ backgroundColor: s.tint }}
        >
          {reading.allergen.emoji}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium text-[var(--ink-primary)]">
          {t.allergens[reading.allergen.apiField]}
        </span>
        <span
          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: s.tint, color: s.ink }}
        >
          {t.severityLabel[sev.level]}
        </span>
      </div>
      <div
        className="mt-3.5 h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: s.track }}
      >
        <div
          className="h-2 rounded-full transition-[width] duration-500"
          style={{ width: `${severityPercent(sev)}%`, backgroundColor: s.fill }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--ink-muted)]">
        {t.peak}: {reading.peakValue.toFixed(1)} {t.grainsUnit}
      </p>
    </div>
  );
}

function DayChip({
  day,
  selected,
  selectedAllergens,
  onClick,
  bcp47,
  t,
}: {
  day: DayForecast;
  selected: boolean;
  selectedAllergens: Set<string>;
  onClick: () => void;
  bcp47: string;
  t: Messages;
}) {
  const sev = overallSeverityOf(
    day.readings.filter((r) => selectedAllergens.has(r.allergen.apiField)),
  );
  const weekday = formatWeekday(day.isoDate, bcp47);
  const relative = formatRelativeLabel(day.isoDate, bcp47, t.today, t.tomorrow);
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-w-[88px] flex-col items-center gap-1.5 rounded-2xl px-4 py-3 transition-all
        ${selected
          ? 'bg-white shadow-[0_4px_16px_rgba(11,11,11,0.08)] ring-2 ring-[var(--brand)]'
          : 'bg-white/50 ring-1 ring-[var(--hairline)] hover:bg-white'}`}
    >
      <span
        className={`text-[11px] font-semibold uppercase tracking-wider
          ${selected ? 'text-[var(--ink-primary)]' : 'text-[var(--ink-muted)]'}`}
      >
        {weekday}
      </span>
      <SeverityDot sev={sev} />
      <span className="text-xs text-[var(--ink-secondary)]">
        {relative || day.isoDate.slice(5)}
      </span>
    </button>
  );
}

function SkeletonLoader() {
  return (
    <div className="mt-5 space-y-4" aria-hidden>
      <div className="h-10 w-56 animate-pulse rounded-xl bg-black/[0.05]" />
      <div className="h-44 animate-pulse rounded-3xl bg-black/[0.05]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="h-28 animate-pulse rounded-2xl bg-black/[0.05]" />
        <div className="h-28 animate-pulse rounded-2xl bg-black/[0.05]" />
      </div>
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AllergyScreen() {
  const { locale, t } = useI18n();
  const bcp47 = LOCALE_BCP47[locale];

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [searchResults, setSearchResults] = useState<GeoLocation[]>([]);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // Which allergens the user cares about (by apiField). Defaults to all.
  const [selectedAllergens, setSelectedAllergens] = useState<Set<string>>(
    () => new Set(ALL_ALLERGEN_FIELDS),
  );
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep latest translations available inside async callbacks for error messages.
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  const loadForecastFor = useCallback(async (loc: GeoLocation) => {
    setSearchResults([]);
    setQuery(displayName(loc));
    setError(null);
    setIsLoadingForecast(true);
    try {
      const result = await fetchForecast(loc);
      setForecast(result);
      setSelectedDayIndex(0);
      saveLocation(loc);
    } catch {
      setError(tRef.current.errors.forecastFailed);
    } finally {
      setIsLoadingForecast(false);
    }
  }, []);

  // Load persisted location + allergen selection (client-only) on mount.
  useEffect(() => {
    const savedAllergens = loadAllergens();
    if (savedAllergens && savedAllergens.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedAllergens(new Set(savedAllergens));
    }
    const saved = loadLocation();
    if (saved) loadForecastFor(saved);
  }, [loadForecastFor]);

  const toggleAllergen = (apiField: string) => {
    setSelectedAllergens((prev) => {
      const next = new Set(prev);
      if (next.has(apiField)) next.delete(apiField);
      else next.add(apiField);
      saveAllergens([...next]);
      return next;
    });
  };

  const selectAllAllergens = () => {
    const next = new Set(ALL_ALLERGEN_FIELDS);
    setSelectedAllergens(next);
    saveAllergens([...next]);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(() => doSearch(value), 400);
  };

  const doSearch = async (q: string) => {
    setIsSearching(true);
    try {
      const results = await searchLocations(q);
      setSearchResults(results);
    } catch {
      // silently ignore search errors
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError(t.errors.geolocationUnsupported);
      return;
    }
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const loc: GeoLocation = {
            name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude,
          };
          // Try to resolve a human-readable name via Nominatim.
          try {
            const r = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'Accept-Language': locale } }
            );
            if (r.ok) {
              const d = await r.json();
              const addr = d.address ?? {};
              loc.name = addr.city ?? addr.town ?? addr.village ?? addr.county ?? loc.name;
              loc.admin1 = addr.state ?? undefined;
              loc.country = addr.country ?? undefined;
            }
          } catch { /* use coordinate fallback */ }
          await loadForecastFor(loc);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setError(t.errors.locationFailed);
      },
      { timeout: 10_000 }
    );
  };

  const selectedDay = forecast?.days[selectedDayIndex] ?? null;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-[var(--hairline)] bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
          <h1 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-[var(--ink-primary)]">
            <span
              aria-hidden
              className="grid size-9 place-items-center rounded-xl bg-[var(--brand-tint)] text-base"
            >
              🌿
            </span>
            Allergy Radar
          </h1>
          <div className="flex items-center gap-1">
            {forecast && (
              <button
                onClick={() => loadForecastFor(forecast.location)}
                disabled={isLoadingForecast}
                className="rounded-full p-2.5 text-[var(--brand-deep)] transition-colors hover:bg-[var(--brand-tint)] disabled:opacity-40"
                title={t.refresh}
                aria-label={t.refresh}
              >
                <svg className={`h-5 w-5 ${isLoadingForecast ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">

        {/* Search + GPS */}
        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--ink-muted)]"
              fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && query.trim() && doSearch(query)}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-2xl border border-[var(--hairline)] bg-white py-3.5 pl-11 pr-10 text-[15px] text-[var(--ink-primary)] shadow-[0_1px_2px_rgba(11,11,11,0.04)] outline-none transition placeholder:text-[var(--ink-muted)] focus:border-[var(--brand)] focus:ring-[3px] focus:ring-[var(--brand-tint)]"
            />
            {isSearching && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
              </div>
            )}
          </div>
          <button
            onClick={handleUseLocation}
            disabled={isLocating}
            className="grid w-[52px] shrink-0 place-items-center rounded-2xl border border-[var(--hairline)] bg-white text-[var(--brand-deep)] shadow-[0_1px_2px_rgba(11,11,11,0.04)] transition hover:bg-[var(--brand-tint)] disabled:opacity-40"
            title={t.useMyLocation}
            aria-label={t.useMyLocation}
          >
            {isLocating ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
              </svg>
            )}
          </button>
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-[var(--hairline)] bg-white shadow-[0_12px_32px_rgba(11,11,11,0.10)]">
            {searchResults.map((loc, i) => (
              <button
                key={i}
                onClick={() => { setSearchResults([]); loadForecastFor(loc); }}
                className="flex w-full items-center gap-3 border-b border-[var(--hairline)] px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-[var(--brand-tint)]"
              >
                <svg className="h-4 w-4 shrink-0 text-[var(--ink-muted)]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                <span>
                  <span className="font-medium text-[var(--ink-primary)]">{loc.name}</span>
                  {(loc.admin1 || loc.country) && (
                    <span className="ml-1.5 text-[var(--ink-muted)]">
                      {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoadingForecast && <SkeletonLoader />}

        {/* Error */}
        {error && (
          <div
            className="mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm"
            style={{
              backgroundColor: 'var(--sev-veryhigh-tint)',
              borderColor: 'var(--sev-veryhigh-track)',
              color: 'var(--sev-veryhigh-ink)',
            }}
          >
            <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.02 13.9A2 2 0 004 21h16a2 2 0 001.73-3.24l-8.02-13.9a2 2 0 00-3.42 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Forecast content */}
        {forecast && !isLoadingForecast && (
          <div className="animate-fade-up">
            {/* Location name */}
            <div className="mt-6 flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0 text-[var(--brand-deep)]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <h2 className="truncate text-lg font-semibold tracking-tight text-[var(--ink-primary)]">
                {displayName(forecast.location)}
              </h2>
            </div>

            {/* Allergen filter */}
            <AllergenFilter
              selected={selectedAllergens}
              onToggle={toggleAllergen}
              onSelectAll={selectAllAllergens}
            />

            {/* Day selector */}
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1.5">
              {forecast.days.map((day, i) => (
                <DayChip
                  key={day.isoDate}
                  day={day}
                  selected={i === selectedDayIndex}
                  selectedAllergens={selectedAllergens}
                  onClick={() => setSelectedDayIndex(i)}
                  bcp47={bcp47}
                  t={t}
                />
              ))}
            </div>

            {/* Selected day content */}
            {selectedDay && (
              <div className="mt-4 space-y-5">
                {selectedAllergens.size === 0 ? (
                  <div
                    className="rounded-2xl border p-4 text-sm"
                    style={{
                      backgroundColor: 'var(--sev-moderate-tint)',
                      borderColor: 'var(--sev-moderate-track)',
                      color: 'var(--sev-moderate-ink)',
                    }}
                  >
                    {t.noAllergensSelected}
                  </div>
                ) : (
                  <>
                    <OverallRiskCard
                      readings={selectedDay.readings.filter((r) =>
                        selectedAllergens.has(r.allergen.apiField),
                      )}
                      t={t}
                    />

                    {/* Allergen breakdown */}
                    <div>
                      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-muted)]">
                        {t.allergenBreakdown}
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {selectedDay.readings
                          .filter((r) => selectedAllergens.has(r.allergen.apiField))
                          .map((r) => (
                            <AllergenCard key={r.allergen.apiField} reading={r} t={t} />
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Attribution */}
            <p className="mt-10 text-center text-xs text-[var(--ink-muted)]">
              {t.dataFrom}{' '}
              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[var(--hairline)] underline-offset-2 transition-colors hover:text-[var(--ink-secondary)]"
              >
                Open-Meteo
              </a>
            </p>
          </div>
        )}

        {/* Empty state */}
        {!forecast && !isLoadingForecast && !error && (
          <div className="mt-20 flex flex-col items-center gap-4 text-center animate-fade-up">
            <span
              aria-hidden
              className="grid size-20 place-items-center rounded-full bg-[var(--brand-tint)] text-4xl shadow-[0_8px_24px_rgba(5,150,105,0.12)]"
            >
              🌿
            </span>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--ink-primary)]">
              {t.emptyTitle}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--ink-secondary)]">
              {t.emptyState}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
