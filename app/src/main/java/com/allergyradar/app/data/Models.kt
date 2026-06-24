package com.allergyradar.app.data

import androidx.compose.ui.graphics.Color
import com.allergyradar.app.ui.theme.SeverityHigh
import com.allergyradar.app.ui.theme.SeverityLow
import com.allergyradar.app.ui.theme.SeverityModerate
import com.allergyradar.app.ui.theme.SeverityNone
import com.allergyradar.app.ui.theme.SeverityVeryHigh

/**
 * How intense the allergy load is for a given pollen on a given day.
 * Ordered from least to most severe so [ordinal] can be used for comparison.
 */
enum class Severity(val label: String, val color: Color) {
    NONE("None", SeverityNone),
    LOW("Low", SeverityLow),
    MODERATE("Moderate", SeverityModerate),
    HIGH("High", SeverityHigh),
    VERY_HIGH("Very high", SeverityVeryHigh);

    /** Short, human-friendly advice shown on the overall risk card. */
    val advice: String
        get() = when (this) {
            NONE -> "No relevant pollen in the air. Enjoy the outdoors!"
            LOW -> "Pollen levels are low. Most people will feel fine."
            MODERATE -> "Some pollen about. Sensitive people may notice symptoms."
            HIGH -> "High pollen load. Consider antihistamines and limit time outside."
            VERY_HIGH -> "Very high pollen. Keep windows closed and take precautions."
        }
}

/**
 * The common airborne allergens covered by the Open-Meteo pollen forecast.
 * Coverage is currently Europe-wide.
 *
 * Thresholds are in grains/m³ and follow widely used European pollen bands.
 * They vary slightly between national services, so treat them as guidance.
 */
enum class Allergen(
    val apiField: String,
    val displayName: String,
    val emoji: String,
    private val lowMax: Double,
    private val moderateMax: Double,
    private val highMax: Double,
) {
    ALDER("alder_pollen", "Alder", "🌿", 10.0, 50.0, 500.0),
    BIRCH("birch_pollen", "Birch", "🌳", 10.0, 50.0, 500.0),
    GRASS("grass_pollen", "Grass", "🌱", 5.0, 30.0, 150.0),
    MUGWORT("mugwort_pollen", "Mugwort", "🌾", 10.0, 50.0, 500.0),
    OLIVE("olive_pollen", "Olive", "🫒", 10.0, 50.0, 500.0),
    RAGWEED("ragweed_pollen", "Ragweed", "🍂", 5.0, 20.0, 100.0);

    /** Maps a concentration (grains/m³) to a [Severity] band for this allergen. */
    fun severityFor(value: Double): Severity = when {
        value <= 0.0 -> Severity.NONE
        value <= lowMax -> Severity.LOW
        value <= moderateMax -> Severity.MODERATE
        value <= highMax -> Severity.HIGH
        else -> Severity.VERY_HIGH
    }

    companion object {
        /** Comma-separated list of API fields for the hourly request. */
        val apiFields: String get() = Allergen.entries.joinToString(",") { it.apiField }
    }
}

/** A geocoded place the user can pick as their location. */
data class GeoLocation(
    val name: String,
    val admin1: String?,
    val country: String?,
    val latitude: Double,
    val longitude: Double,
) {
    /** e.g. "Leipzig, Saxony, Germany" */
    val displayName: String
        get() = listOfNotNull(name, admin1?.takeIf { it.isNotBlank() && it != name }, country)
            .joinToString(", ")
}

/** One allergen's reading for a single day: the peak concentration and its band. */
data class AllergenReading(
    val allergen: Allergen,
    val peakValue: Double,
    val severity: Severity,
)

/** All allergen readings for a single calendar day plus the worst-case overall band. */
data class DayForecast(
    val isoDate: String,
    val weekdayLabel: String,
    val relativeLabel: String,
    val readings: List<AllergenReading>,
) {
    /** The overall day risk is driven by the most severe individual allergen. */
    val overall: Severity
        get() = readings.maxByOrNull { it.severity.ordinal }?.severity ?: Severity.NONE

    /** Allergens worth calling out (anything above "none"), worst first. */
    val activeReadings: List<AllergenReading>
        get() = readings.filter { it.severity != Severity.NONE }
            .sortedByDescending { it.severity.ordinal }
}

/** The full forecast result for a location across several days. */
data class ForecastResult(
    val location: GeoLocation,
    val days: List<DayForecast>,
)
