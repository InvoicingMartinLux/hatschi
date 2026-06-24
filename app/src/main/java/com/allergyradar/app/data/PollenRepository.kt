package com.allergyradar.app.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

/**
 * Talks to the free, key-less Open-Meteo APIs:
 *  - Geocoding API to turn an address/place into coordinates.
 *  - Air-Quality API to fetch the hourly pollen forecast.
 *
 * Networking uses [HttpURLConnection] and JSON is parsed with [org.json] so the
 * app needs no third-party HTTP or serialization libraries.
 */
class PollenRepository {

    /** Looks up candidate locations for a free-text address/place query. */
    suspend fun searchLocations(query: String): List<GeoLocation> = withContext(Dispatchers.IO) {
        val trimmed = query.trim()
        if (trimmed.isEmpty()) return@withContext emptyList()

        val url = "$GEOCODING_URL?name=${trimmed.urlEncoded()}" +
            "&count=6&language=en&format=json"
        val json = httpGet(url)
        val results = json.optJSONArray("results") ?: return@withContext emptyList()

        buildList {
            for (i in 0 until results.length()) {
                val o = results.getJSONObject(i)
                add(
                    GeoLocation(
                        name = o.optString("name"),
                        admin1 = o.optString("admin1").ifBlank { null },
                        country = o.optString("country").ifBlank { null },
                        latitude = o.getDouble("latitude"),
                        longitude = o.getDouble("longitude"),
                    )
                )
            }
        }
    }

    /** Fetches a multi-day pollen forecast for the given location. */
    suspend fun fetchForecast(
        location: GeoLocation,
        forecastDays: Int = FORECAST_DAYS,
    ): ForecastResult = withContext(Dispatchers.IO) {
        val url = "$AIR_QUALITY_URL?latitude=${location.latitude}" +
            "&longitude=${location.longitude}" +
            "&hourly=${Allergen.apiFields}" +
            "&timezone=auto&forecast_days=$forecastDays"
        val json = httpGet(url)
        val hourly = json.optJSONObject("hourly")
            ?: throw IOException("No pollen data available for this location.")

        val times = hourly.optJSONArray("time")
            ?: throw IOException("Malformed forecast response.")

        // For each allergen, reduce the hourly series to a per-day peak value.
        // dailyPeaks[isoDate][allergen] = max concentration that day.
        val dailyPeaks = linkedMapOf<String, MutableMap<Allergen, Double>>()

        for (allergen in Allergen.entries) {
            val series = hourly.optJSONArray(allergen.apiField) ?: continue
            val count = minOf(times.length(), series.length())
            for (i in 0 until count) {
                if (series.isNull(i)) continue
                val isoDate = times.getString(i).substringBefore('T')
                val value = series.getDouble(i)
                val dayMap = dailyPeaks.getOrPut(isoDate) { mutableMapOf() }
                val current = dayMap[allergen] ?: Double.NEGATIVE_INFINITY
                if (value > current) dayMap[allergen] = value
            }
        }

        val days = dailyPeaks.entries.map { (isoDate, peaks) ->
            val date = runCatching { LocalDate.parse(isoDate) }.getOrNull()
            val readings = Allergen.entries.map { allergen ->
                val peak = peaks[allergen]?.coerceAtLeast(0.0) ?: 0.0
                AllergenReading(
                    allergen = allergen,
                    peakValue = peak,
                    severity = allergen.severityFor(peak),
                )
            }
            DayForecast(
                isoDate = isoDate,
                weekdayLabel = date?.dayOfWeek
                    ?.getDisplayName(TextStyle.SHORT, Locale.getDefault())
                    ?: isoDate,
                relativeLabel = relativeLabel(date),
                readings = readings,
            )
        }

        if (days.isEmpty()) {
            throw IOException("No pollen forecast is available for this location yet.")
        }

        ForecastResult(location = location, days = days)
    }

    private fun relativeLabel(date: LocalDate?): String {
        if (date == null) return ""
        val today = LocalDate.now()
        return when (date) {
            today -> "Today"
            today.plusDays(1) -> "Tomorrow"
            else -> date.format(DATE_LABEL_FORMAT)
        }
    }

    private fun httpGet(urlString: String): JSONObject {
        val connection = (URL(urlString).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            connectTimeout = 15_000
            readTimeout = 15_000
            setRequestProperty("Accept", "application/json")
            setRequestProperty("User-Agent", "AllergyRadar/1.0 (Android)")
        }
        try {
            val code = connection.responseCode
            if (code !in 200..299) {
                throw IOException("Server returned HTTP $code. Please try again.")
            }
            val body = connection.inputStream.bufferedReader().use { it.readText() }
            return JSONObject(body)
        } catch (e: IOException) {
            throw e
        } catch (e: Exception) {
            throw IOException("Could not reach the forecast service.", e)
        } finally {
            connection.disconnect()
        }
    }

    private fun String.urlEncoded(): String = URLEncoder.encode(this, "UTF-8")

    companion object {
        private const val GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
        private const val AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
        private const val FORECAST_DAYS = 4
        private val DATE_LABEL_FORMAT = DateTimeFormatter.ofPattern("EEE, d MMM", Locale.getDefault())
    }
}
