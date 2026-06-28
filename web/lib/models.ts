export type SeverityLevel = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';

export interface Severity {
  level: SeverityLevel;
  label: string;
  color: string;         // Tailwind bg class
  textColor: string;     // Tailwind text class
  borderColor: string;   // Tailwind border class
  advice: string;
  ordinal: number;
}

export const SEVERITIES: Record<SeverityLevel, Severity> = {
  NONE: {
    level: 'NONE',
    label: 'None',
    color: 'bg-gray-400',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-400',
    advice: 'No relevant pollen in the air. Enjoy the outdoors!',
    ordinal: 0,
  },
  LOW: {
    level: 'LOW',
    label: 'Low',
    color: 'bg-green-600',
    textColor: 'text-green-700',
    borderColor: 'border-green-600',
    advice: 'Pollen levels are low. Most people will feel fine.',
    ordinal: 1,
  },
  MODERATE: {
    level: 'MODERATE',
    label: 'Moderate',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-500',
    advice: 'Some pollen about. Sensitive people may notice symptoms.',
    ordinal: 2,
  },
  HIGH: {
    level: 'HIGH',
    label: 'High',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-500',
    advice: 'High pollen load. Consider antihistamines and limit time outside.',
    ordinal: 3,
  },
  VERY_HIGH: {
    level: 'VERY_HIGH',
    label: 'Very high',
    color: 'bg-red-600',
    textColor: 'text-red-700',
    borderColor: 'border-red-600',
    advice: 'Very high pollen. Keep windows closed and take precautions.',
    ordinal: 4,
  },
};

export interface AllergenDef {
  apiField: string;
  displayName: string;
  emoji: string;
  lowMax: number;
  moderateMax: number;
  highMax: number;
}

export const ALLERGENS: AllergenDef[] = [
  { apiField: 'alder_pollen',   displayName: 'Alder',   emoji: '🌿', lowMax: 10,  moderateMax: 50,  highMax: 500 },
  { apiField: 'birch_pollen',   displayName: 'Birch',   emoji: '🌳', lowMax: 10,  moderateMax: 50,  highMax: 500 },
  { apiField: 'grass_pollen',   displayName: 'Grass',   emoji: '🌱', lowMax: 5,   moderateMax: 30,  highMax: 150 },
  { apiField: 'mugwort_pollen', displayName: 'Mugwort', emoji: '🌾', lowMax: 10,  moderateMax: 50,  highMax: 500 },
  { apiField: 'olive_pollen',   displayName: 'Olive',   emoji: '🫒', lowMax: 10,  moderateMax: 50,  highMax: 500 },
  { apiField: 'ragweed_pollen', displayName: 'Ragweed', emoji: '🍂', lowMax: 5,   moderateMax: 20,  highMax: 100 },
];

export function severityFor(allergen: AllergenDef, value: number): Severity {
  if (value <= 0) return SEVERITIES.NONE;
  if (value <= allergen.lowMax) return SEVERITIES.LOW;
  if (value <= allergen.moderateMax) return SEVERITIES.MODERATE;
  if (value <= allergen.highMax) return SEVERITIES.HIGH;
  return SEVERITIES.VERY_HIGH;
}

export interface GeoLocation {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export function displayName(loc: GeoLocation): string {
  return [loc.name, loc.admin1 && loc.admin1 !== loc.name ? loc.admin1 : null, loc.country]
    .filter(Boolean)
    .join(', ');
}

export interface AllergenReading {
  allergen: AllergenDef;
  peakValue: number;
  severity: Severity;
}

export interface DayForecast {
  isoDate: string;
  readings: AllergenReading[];
  overall: Severity;
  activeReadings: AllergenReading[];
}

export interface ForecastResult {
  location: GeoLocation;
  days: DayForecast[];
}
