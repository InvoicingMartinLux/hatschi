import type { SeverityLevel } from './models';

export type Locale = 'en' | 'de' | 'fr' | 'es' | 'it';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'de', 'fr', 'es', 'it'];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  fr: '🇫🇷',
  es: '🇪🇸',
  it: '🇮🇹',
};

/** BCP-47 tags used for Intl date formatting. */
export const LOCALE_BCP47: Record<Locale, string> = {
  en: 'en-GB',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
  it: 'it-IT',
};

export interface Messages {
  searchPlaceholder: string;
  useMyLocation: string;
  refresh: string;
  location: string;
  overallRisk: string;
  allergenBreakdown: string;
  peak: string; // e.g. "Peak"
  grainsUnit: string; // e.g. "grains/m³"
  dataFrom: string; // "Pollen data from"
  emptyState: string;
  today: string;
  tomorrow: string;
  language: string;
  errors: {
    geolocationUnsupported: string;
    locationFailed: string;
    forecastFailed: string;
  };
  severityLabel: Record<SeverityLevel, string>;
  severityAdvice: Record<SeverityLevel, string>;
  allergens: Record<string, string>; // keyed by apiField
}

export const TRANSLATIONS: Record<Locale, Messages> = {
  en: {
    searchPlaceholder: 'Search city or postcode…',
    useMyLocation: 'Use my location',
    refresh: 'Refresh forecast',
    location: 'Location',
    overallRisk: 'Overall risk',
    allergenBreakdown: 'Allergen breakdown',
    peak: 'Peak',
    grainsUnit: 'grains/m³',
    dataFrom: 'Pollen data from',
    emptyState: 'Search for a city or use your location to see the pollen forecast.',
    today: 'Today',
    tomorrow: 'Tomorrow',
    language: 'Language',
    errors: {
      geolocationUnsupported: 'Geolocation is not supported by your browser.',
      locationFailed: 'Could not determine your location.',
      forecastFailed: 'Failed to load the pollen forecast. Please try again.',
    },
    severityLabel: {
      NONE: 'None',
      LOW: 'Low',
      MODERATE: 'Moderate',
      HIGH: 'High',
      VERY_HIGH: 'Very high',
    },
    severityAdvice: {
      NONE: 'No relevant pollen in the air. Enjoy the outdoors!',
      LOW: 'Pollen levels are low. Most people will feel fine.',
      MODERATE: 'Some pollen about. Sensitive people may notice symptoms.',
      HIGH: 'High pollen load. Consider antihistamines and limit time outside.',
      VERY_HIGH: 'Very high pollen. Keep windows closed and take precautions.',
    },
    allergens: {
      alder_pollen: 'Alder',
      birch_pollen: 'Birch',
      grass_pollen: 'Grass',
      mugwort_pollen: 'Mugwort',
      olive_pollen: 'Olive',
      ragweed_pollen: 'Ragweed',
    },
  },
  de: {
    searchPlaceholder: 'Stadt oder Postleitzahl suchen…',
    useMyLocation: 'Meinen Standort verwenden',
    refresh: 'Vorhersage aktualisieren',
    location: 'Standort',
    overallRisk: 'Gesamtrisiko',
    allergenBreakdown: 'Allergen-Übersicht',
    peak: 'Spitzenwert',
    grainsUnit: 'Körner/m³',
    dataFrom: 'Pollendaten von',
    emptyState: 'Suchen Sie eine Stadt oder verwenden Sie Ihren Standort, um die Pollenvorhersage zu sehen.',
    today: 'Heute',
    tomorrow: 'Morgen',
    language: 'Sprache',
    errors: {
      geolocationUnsupported: 'Standortbestimmung wird von Ihrem Browser nicht unterstützt.',
      locationFailed: 'Ihr Standort konnte nicht ermittelt werden.',
      forecastFailed: 'Die Pollenvorhersage konnte nicht geladen werden. Bitte versuchen Sie es erneut.',
    },
    severityLabel: {
      NONE: 'Keine',
      LOW: 'Niedrig',
      MODERATE: 'Mäßig',
      HIGH: 'Hoch',
      VERY_HIGH: 'Sehr hoch',
    },
    severityAdvice: {
      NONE: 'Keine relevanten Pollen in der Luft. Genießen Sie die Natur!',
      LOW: 'Die Pollenbelastung ist niedrig. Die meisten Menschen fühlen sich wohl.',
      MODERATE: 'Etwas Pollen unterwegs. Empfindliche Personen können Symptome bemerken.',
      HIGH: 'Hohe Pollenbelastung. Erwägen Sie Antihistaminika und begrenzen Sie die Zeit im Freien.',
      VERY_HIGH: 'Sehr hohe Pollenbelastung. Halten Sie die Fenster geschlossen und treffen Sie Vorkehrungen.',
    },
    allergens: {
      alder_pollen: 'Erle',
      birch_pollen: 'Birke',
      grass_pollen: 'Gräser',
      mugwort_pollen: 'Beifuß',
      olive_pollen: 'Olive',
      ragweed_pollen: 'Ambrosia',
    },
  },
  fr: {
    searchPlaceholder: 'Rechercher une ville ou un code postal…',
    useMyLocation: 'Utiliser ma position',
    refresh: 'Actualiser les prévisions',
    location: 'Emplacement',
    overallRisk: 'Risque global',
    allergenBreakdown: 'Détail des allergènes',
    peak: 'Pic',
    grainsUnit: 'grains/m³',
    dataFrom: 'Données polliniques de',
    emptyState: 'Recherchez une ville ou utilisez votre position pour voir les prévisions polliniques.',
    today: "Aujourd'hui",
    tomorrow: 'Demain',
    language: 'Langue',
    errors: {
      geolocationUnsupported: "La géolocalisation n'est pas prise en charge par votre navigateur.",
      locationFailed: "Impossible de déterminer votre position.",
      forecastFailed: 'Échec du chargement des prévisions polliniques. Veuillez réessayer.',
    },
    severityLabel: {
      NONE: 'Aucun',
      LOW: 'Faible',
      MODERATE: 'Modéré',
      HIGH: 'Élevé',
      VERY_HIGH: 'Très élevé',
    },
    severityAdvice: {
      NONE: "Aucun pollen pertinent dans l'air. Profitez du plein air !",
      LOW: 'Les niveaux de pollen sont faibles. La plupart des gens se sentiront bien.',
      MODERATE: 'Un peu de pollen. Les personnes sensibles peuvent ressentir des symptômes.',
      HIGH: "Forte charge pollinique. Envisagez des antihistaminiques et limitez le temps passé dehors.",
      VERY_HIGH: 'Pollen très élevé. Gardez les fenêtres fermées et prenez vos précautions.',
    },
    allergens: {
      alder_pollen: 'Aulne',
      birch_pollen: 'Bouleau',
      grass_pollen: 'Graminées',
      mugwort_pollen: 'Armoise',
      olive_pollen: 'Olivier',
      ragweed_pollen: 'Ambroisie',
    },
  },
  es: {
    searchPlaceholder: 'Buscar ciudad o código postal…',
    useMyLocation: 'Usar mi ubicación',
    refresh: 'Actualizar pronóstico',
    location: 'Ubicación',
    overallRisk: 'Riesgo general',
    allergenBreakdown: 'Desglose de alérgenos',
    peak: 'Pico',
    grainsUnit: 'granos/m³',
    dataFrom: 'Datos de polen de',
    emptyState: 'Busca una ciudad o usa tu ubicación para ver el pronóstico de polen.',
    today: 'Hoy',
    tomorrow: 'Mañana',
    language: 'Idioma',
    errors: {
      geolocationUnsupported: 'Tu navegador no admite la geolocalización.',
      locationFailed: 'No se pudo determinar tu ubicación.',
      forecastFailed: 'No se pudo cargar el pronóstico de polen. Inténtalo de nuevo.',
    },
    severityLabel: {
      NONE: 'Ninguno',
      LOW: 'Bajo',
      MODERATE: 'Moderado',
      HIGH: 'Alto',
      VERY_HIGH: 'Muy alto',
    },
    severityAdvice: {
      NONE: 'No hay polen relevante en el aire. ¡Disfruta del aire libre!',
      LOW: 'Los niveles de polen son bajos. La mayoría de las personas se sentirán bien.',
      MODERATE: 'Algo de polen en el aire. Las personas sensibles pueden notar síntomas.',
      HIGH: 'Alta carga de polen. Considera antihistamínicos y limita el tiempo al aire libre.',
      VERY_HIGH: 'Polen muy alto. Mantén las ventanas cerradas y toma precauciones.',
    },
    allergens: {
      alder_pollen: 'Aliso',
      birch_pollen: 'Abedul',
      grass_pollen: 'Gramíneas',
      mugwort_pollen: 'Artemisa',
      olive_pollen: 'Olivo',
      ragweed_pollen: 'Ambrosía',
    },
  },
  it: {
    searchPlaceholder: 'Cerca città o codice postale…',
    useMyLocation: 'Usa la mia posizione',
    refresh: 'Aggiorna previsioni',
    location: 'Posizione',
    overallRisk: 'Rischio complessivo',
    allergenBreakdown: 'Dettaglio allergeni',
    peak: 'Picco',
    grainsUnit: 'granelli/m³',
    dataFrom: 'Dati sui pollini da',
    emptyState: 'Cerca una città o usa la tua posizione per vedere le previsioni dei pollini.',
    today: 'Oggi',
    tomorrow: 'Domani',
    language: 'Lingua',
    errors: {
      geolocationUnsupported: 'La geolocalizzazione non è supportata dal tuo browser.',
      locationFailed: 'Impossibile determinare la tua posizione.',
      forecastFailed: 'Impossibile caricare le previsioni dei pollini. Riprova.',
    },
    severityLabel: {
      NONE: 'Nessuno',
      LOW: 'Basso',
      MODERATE: 'Moderato',
      HIGH: 'Alto',
      VERY_HIGH: 'Molto alto',
    },
    severityAdvice: {
      NONE: "Nessun polline rilevante nell'aria. Goditi l'aria aperta!",
      LOW: 'I livelli di polline sono bassi. La maggior parte delle persone starà bene.',
      MODERATE: 'Un po\' di polline nell\'aria. Le persone sensibili potrebbero notare sintomi.',
      HIGH: "Elevato carico di pollini. Valuta gli antistaminici e limita il tempo all'aperto.",
      VERY_HIGH: 'Pollini molto elevati. Tieni le finestre chiuse e prendi precauzioni.',
    },
    allergens: {
      alder_pollen: 'Ontano',
      birch_pollen: 'Betulla',
      grass_pollen: 'Graminacee',
      mugwort_pollen: 'Artemisia',
      olive_pollen: 'Olivo',
      ragweed_pollen: 'Ambrosia',
    },
  },
};

const STORAGE_KEY = 'allergyradar_locale';

/** Reads the saved locale, or null if none/invalid. */
export function getStoredLocale(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && (SUPPORTED_LOCALES as string[]).includes(v) ? (v as Locale) : null;
  } catch {
    return null;
  }
}

export function setStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

/**
 * Determines the initial locale: stored choice → browser language → English.
 */
export function detectLocale(): Locale {
  const stored = getStoredLocale();
  if (stored) return stored;

  if (typeof navigator !== 'undefined') {
    const candidates = navigator.languages ?? [navigator.language];
    for (const lang of candidates) {
      const base = lang.toLowerCase().split('-')[0];
      if ((SUPPORTED_LOCALES as string[]).includes(base)) {
        return base as Locale;
      }
    }
  }
  return 'en';
}
