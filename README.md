# 🌿 Allergy Radar

An Android app that works like a **weather forecast for allergies**. Enter your
address and it shows how strong hay fever and other common pollen allergies are
**today and over the next few days** for your exact location.

## What it does

- **Address search** – type a city, postcode or address and pick the matching
  place. Your location is remembered for next time.
- **Use my location (GPS)** – one tap resolves your current position via the
  device's built-in location services and reverse-geocodes it to a place name.
- **Daily high-pollen alerts** – opt in to a background check that sends a
  notification when the local pollen level is **High or worse** that day.
- **Pollen forecast** – fetches a multi-day forecast for the six most common
  airborne allergens:
  - 🌳 Birch, 🌿 Alder, 🫒 Olive (tree pollen)
  - 🌱 Grass
  - 🌾 Mugwort, 🍂 Ragweed (weed pollen)
- **Today + next days** – a day selector lets you see the overall pollen risk
  and a per-allergen breakdown for each day.
- **Severity at a glance** – a colour-coded traffic-light scale
  (Low → Moderate → High → Very high) plus the peak concentration in grains/m³
  and plain-language advice.

## How it works

- **Geocoding:** [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
  turns the address into coordinates.
- **Pollen data:** [Open-Meteo Air-Quality API](https://open-meteo.com/en/docs/air-quality-api)
  provides the hourly pollen forecast, which the app reduces to a daily peak per
  allergen and maps to a severity band.

Both APIs are **free and require no API key**. Pollen coverage is currently
Europe-wide.

> Severity thresholds follow widely used European pollen bands and vary slightly
> between national services — treat them as guidance, not medical advice.

## Tech stack

- **Kotlin** + **Jetpack Compose** (Material 3)
- MVVM with `ViewModel` + `StateFlow`
- Networking via `HttpURLConnection` and JSON parsing via `org.json` — no
  third-party HTTP/serialization libraries
- GPS via the platform `LocationManager` + `Geocoder` (no Google Play Services)
- Background alerts via **WorkManager** (daily check, de-duplicated per day)
- Last location and preferences persisted in `SharedPreferences`
- `minSdk 26`, `targetSdk 34`

## Permissions

- `INTERNET` – fetch forecasts.
- `ACCESS_COARSE_LOCATION` / `ACCESS_FINE_LOCATION` – only used when you tap
  **Use my location**.
- `POST_NOTIFICATIONS` (Android 13+) – only requested when you turn on
  **Daily alerts**.

## Building

You need the Android SDK (e.g. via Android Studio).

```bash
# Open in Android Studio and press Run, or from the command line:
./gradlew assembleDebug

# Install on a connected device/emulator:
./gradlew installDebug
```

The app only needs the `INTERNET` permission.

## Project structure

```
app/src/main/java/com/allergyradar/app/
├── MainActivity.kt              # Compose entry point
├── data/
│   ├── Models.kt                # Allergen / Severity / forecast models + thresholds
│   ├── PollenRepository.kt      # Open-Meteo geocoding + air-quality calls
│   ├── LocationProvider.kt      # GPS fix + reverse geocoding
│   └── LocationStore.kt         # SharedPreferences (location + alert prefs)
├── notifications/
│   ├── PollenAlertWorker.kt     # WorkManager job: check forecast, notify if high
│   ├── PollenNotifier.kt        # Notification channel + builder
│   └── AlertScheduler.kt        # Schedule/cancel the daily check
└── ui/
    ├── AllergyViewModel.kt      # State, search, GPS, alerts, forecast loading
    ├── AllergyScreen.kt         # Compose UI
    └── theme/                   # Material 3 theme
```
