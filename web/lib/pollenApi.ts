import {
  ALLERGENS,
  type AllergenReading,
  type DayForecast,
  type ForecastResult,
  type GeoLocation,
  severityFor,
  SEVERITIES,
} from './models';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const FORECAST_DAYS = 4;

export async function searchLocations(query: string): Promise<GeoLocation[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(trimmed)}&count=6&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (HTTP ${res.status})`);

  const data = await res.json();
  const results: GeoLocation[] = [];
  for (const o of data.results ?? []) {
    results.push({
      name: o.name ?? '',
      admin1: o.admin1 || undefined,
      country: o.country || undefined,
      latitude: o.latitude,
      longitude: o.longitude,
    });
  }
  return results;
}

export async function fetchForecast(location: GeoLocation): Promise<ForecastResult> {
  const fields = ALLERGENS.map((a) => a.apiField).join(',');
  const url =
    `${AIR_QUALITY_URL}?latitude=${location.latitude}` +
    `&longitude=${location.longitude}` +
    `&hourly=${fields}` +
    `&timezone=auto&forecast_days=${FORECAST_DAYS}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Forecast fetch failed (HTTP ${res.status})`);

  const data = await res.json();
  const hourly = data.hourly;
  if (!hourly) throw new Error('No pollen data available for this location.');

  const times: string[] = hourly.time ?? [];

  // dailyPeaks[isoDate][apiField] = max concentration that day
  const dailyPeaks: Record<string, Record<string, number>> = {};

  for (const allergen of ALLERGENS) {
    const series: (number | null)[] = hourly[allergen.apiField] ?? [];
    const count = Math.min(times.length, series.length);
    for (let i = 0; i < count; i++) {
      const val = series[i];
      if (val == null) continue;
      const isoDate = times[i].split('T')[0];
      if (!dailyPeaks[isoDate]) dailyPeaks[isoDate] = {};
      const cur = dailyPeaks[isoDate][allergen.apiField] ?? -Infinity;
      if (val > cur) dailyPeaks[isoDate][allergen.apiField] = val;
    }
  }

  const days: DayForecast[] = Object.entries(dailyPeaks).map(([isoDate, peaks]) => {
    const readings: AllergenReading[] = ALLERGENS.map((allergen) => {
      const peak = Math.max(0, peaks[allergen.apiField] ?? 0);
      return {
        allergen,
        peakValue: peak,
        severity: severityFor(allergen, peak),
      };
    });

    const overall =
      readings.reduce<typeof SEVERITIES.NONE | undefined>((best, r) =>
        !best || r.severity.ordinal > best.ordinal ? r.severity : best, undefined) ?? SEVERITIES.NONE;

    const activeReadings = readings
      .filter((r) => r.severity.level !== 'NONE')
      .sort((a, b) => b.severity.ordinal - a.severity.ordinal);

    return {
      isoDate,
      readings,
      overall,
      activeReadings,
    };
  });

  if (days.length === 0) throw new Error('No pollen forecast is available for this location yet.');
  return { location, days };
}

function parseDate(iso: string): Date | null {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Locale-aware short weekday for a day card, e.g. "Mon" / "Lun" / "Mo".
 */
export function formatWeekday(isoDate: string, bcp47: string): string {
  const date = parseDate(isoDate);
  if (!date) return isoDate;
  return date.toLocaleDateString(bcp47, { weekday: 'short' });
}

/**
 * Locale-aware relative label: "Today"/"Tomorrow" (translated) or a short date.
 */
export function formatRelativeLabel(
  isoDate: string,
  bcp47: string,
  todayLabel: string,
  tomorrowLabel: string,
): string {
  const date = parseDate(isoDate);
  if (!date) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime()) return todayLabel;
  if (date.getTime() === tomorrow.getTime()) return tomorrowLabel;
  return date.toLocaleDateString(bcp47, { weekday: 'short', day: 'numeric', month: 'short' });
}
