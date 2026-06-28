'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchForecast, formatRelativeLabel, formatWeekday, searchLocations } from '@/lib/pollenApi';
import {
  displayName,
  type AllergenReading,
  type DayForecast,
  type ForecastResult,
  type GeoLocation,
  type Severity,
} from '@/lib/models';
import { useI18n } from './I18nProvider';
import { LOCALE_BCP47, type Messages } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';

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

// ─── Severity utilities ──────────────────────────────────────────────────────

const SEV_BG: Record<string, string> = {
  NONE:      'bg-gray-400',
  LOW:       'bg-green-500',
  MODERATE:  'bg-yellow-400',
  HIGH:      'bg-orange-500',
  VERY_HIGH: 'bg-red-600',
};
const SEV_CARD_BG: Record<string, string> = {
  NONE:      'bg-gray-50  border-gray-200',
  LOW:       'bg-green-50  border-green-200',
  MODERATE:  'bg-yellow-50 border-yellow-200',
  HIGH:      'bg-orange-50 border-orange-200',
  VERY_HIGH: 'bg-red-50    border-red-200',
};
const SEV_TEXT: Record<string, string> = {
  NONE:      'text-gray-600',
  LOW:       'text-green-700',
  MODERATE:  'text-yellow-700',
  HIGH:      'text-orange-700',
  VERY_HIGH: 'text-red-700',
};
const SEV_CHIP_BG: Record<string, string> = {
  NONE:      'bg-gray-100  text-gray-600  border-gray-300',
  LOW:       'bg-green-100 text-green-700 border-green-400',
  MODERATE:  'bg-yellow-100 text-yellow-700 border-yellow-400',
  HIGH:      'bg-orange-100 text-orange-700 border-orange-400',
  VERY_HIGH: 'bg-red-100   text-red-700   border-red-400',
};

function severityBarWidth(sev: Severity): string {
  const pct: Record<string, string> = { NONE: 'w-0', LOW: 'w-1/5', MODERATE: 'w-2/5', HIGH: 'w-3/5', VERY_HIGH: 'w-full' };
  return pct[sev.level] ?? 'w-0';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SeverityDot({ sev }: { sev: Severity }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${SEV_BG[sev.level]}`} />;
}

function OverallRiskCard({ day, t }: { day: DayForecast; t: Messages }) {
  const sev = day.overall;
  return (
    <div className={`rounded-2xl border p-5 ${SEV_CARD_BG[sev.level]}`}>
      <div className="flex items-center gap-2 mb-1">
        <SeverityDot sev={sev} />
        <span className={`text-xs font-semibold uppercase tracking-wide ${SEV_TEXT[sev.level]}`}>
          {t.overallRisk}
        </span>
      </div>
      <p className={`text-3xl font-bold ${SEV_TEXT[sev.level]}`}>{t.severityLabel[sev.level]}</p>
      <p className="mt-2 text-sm text-gray-600">{t.severityAdvice[sev.level]}</p>
      {day.activeReadings.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {day.activeReadings.slice(0, 3).map((r) => (
            <span
              key={r.allergen.apiField}
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SEV_CHIP_BG[r.severity.level]}`}
            >
              {r.allergen.emoji} {t.allergens[r.allergen.apiField]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function AllergenCard({ reading, t }: { reading: AllergenReading; t: Messages }) {
  const sev = reading.severity;
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-800">
          {reading.allergen.emoji} {t.allergens[reading.allergen.apiField]}
        </span>
        <span className={`text-xs font-semibold ${SEV_TEXT[sev.level]}`}>{t.severityLabel[sev.level]}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${SEV_BG[sev.level]} ${severityBarWidth(sev)}`}
        />
      </div>
      <p className="text-xs text-gray-400">
        {t.peak}: {reading.peakValue.toFixed(1)} {t.grainsUnit}
      </p>
    </div>
  );
}

function DayChip({
  day,
  selected,
  onClick,
  bcp47,
  t,
}: {
  day: DayForecast;
  selected: boolean;
  onClick: () => void;
  bcp47: string;
  t: Messages;
}) {
  const sev = day.overall;
  const weekday = formatWeekday(day.isoDate, bcp47);
  const relative = formatRelativeLabel(day.isoDate, bcp47, t.today, t.tomorrow);
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl border-2 transition-all
        ${selected
          ? `${SEV_CARD_BG[sev.level]} border-current ${SEV_TEXT[sev.level]} shadow`
          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'}`}
    >
      <span className="text-xs font-semibold uppercase tracking-wider">{weekday}</span>
      <SeverityDot sev={sev} />
      <span className="text-xs">{relative || day.isoDate.slice(5)}</span>
    </button>
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

  // Load persisted location (from localStorage, client-only) on mount.
  useEffect(() => {
    const saved = loadLocation();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) loadForecastFor(saved);
  }, [loadForecastFor]);

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
    <div className="min-h-screen" style={{ backgroundColor: '#FFF8E1' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-10 backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,248,225,0.92)' }}>
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-green-800">🌿 Allergy Radar</h1>
          <div className="flex items-center gap-1">
            {forecast && (
              <button
                onClick={() => loadForecastFor(forecast.location)}
                disabled={isLoadingForecast}
                className="p-2 rounded-full hover:bg-green-100 text-green-700 transition-colors disabled:opacity-40"
                title={t.refresh}
                aria-label={t.refresh}
              >
                <svg className={`w-5 h-5 ${isLoadingForecast ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pb-10">

        {/* Search + GPS */}
        <div className="mt-4 flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && query.trim() && doSearch(query)}
              placeholder={t.searchPlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {isSearching && (
              <div className="absolute right-3 top-3.5">
                <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            onClick={handleUseLocation}
            disabled={isLocating}
            className="px-3 py-3 rounded-xl bg-white border border-gray-200 shadow-sm text-green-700 hover:bg-green-50 transition-colors disabled:opacity-40"
            title={t.useMyLocation}
            aria-label={t.useMyLocation}
          >
            {isLocating ? (
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06z" />
              </svg>
            )}
          </button>
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-1 rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden">
            {searchResults.map((loc, i) => (
              <button
                key={i}
                onClick={() => { setSearchResults([]); loadForecastFor(loc); }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-green-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <span className="font-medium text-gray-800">{loc.name}</span>
                {(loc.admin1 || loc.country) && (
                  <span className="text-gray-400 ml-1">
                    — {[loc.admin1, loc.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Loading bar */}
        {isLoadingForecast && (
          <div className="mt-4 w-full bg-gray-100 rounded-full h-1 overflow-hidden">
            <div className="h-1 bg-green-500 rounded-full animate-pulse w-3/4" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Forecast content */}
        {forecast && !isLoadingForecast && (
          <>
            {/* Location name */}
            <div className="mt-5 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-700 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <h2 className="text-base font-semibold text-gray-800">
                {displayName(forecast.location)}
              </h2>
            </div>

            {/* Day selector */}
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {forecast.days.map((day, i) => (
                <DayChip
                  key={day.isoDate}
                  day={day}
                  selected={i === selectedDayIndex}
                  onClick={() => setSelectedDayIndex(i)}
                  bcp47={bcp47}
                  t={t}
                />
              ))}
            </div>

            {/* Selected day content */}
            {selectedDay && (
              <div className="mt-4 space-y-4">
                <OverallRiskCard day={selectedDay} t={t} />

                {/* Allergen breakdown */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                    {t.allergenBreakdown}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedDay.readings.map((r) => (
                      <AllergenCard key={r.allergen.apiField} reading={r} t={t} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Attribution */}
            <p className="mt-8 text-center text-xs text-gray-400">
              {t.dataFrom}{' '}
              <a
                href="https://open-meteo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                Open-Meteo
              </a>
            </p>
          </>
        )}

        {/* Empty state */}
        {!forecast && !isLoadingForecast && !error && (
          <div className="mt-16 flex flex-col items-center text-center text-gray-400 gap-3">
            <span className="text-5xl">🌿</span>
            <p className="text-sm">{t.emptyState}</p>
          </div>
        )}
      </main>
    </div>
  );
}
