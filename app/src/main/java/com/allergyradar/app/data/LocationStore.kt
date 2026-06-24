package com.allergyradar.app.data

import android.content.Context

/**
 * Persists the user's chosen location and notification preferences in
 * SharedPreferences. Shared by the UI ([com.allergyradar.app.ui.AllergyViewModel])
 * and the background alert worker so both read/write the same source of truth.
 */
class LocationStore(context: Context) {

    private val prefs = context.applicationContext
        .getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun saveLocation(location: GeoLocation) {
        prefs.edit()
            .putString(KEY_NAME, location.name)
            .putString(KEY_ADMIN1, location.admin1)
            .putString(KEY_COUNTRY, location.country)
            .putFloat(KEY_LAT, location.latitude.toFloat())
            .putFloat(KEY_LON, location.longitude.toFloat())
            .apply()
    }

    fun loadLocation(): GeoLocation? {
        val name = prefs.getString(KEY_NAME, null) ?: return null
        if (!prefs.contains(KEY_LAT) || !prefs.contains(KEY_LON)) return null
        return GeoLocation(
            name = name,
            admin1 = prefs.getString(KEY_ADMIN1, null),
            country = prefs.getString(KEY_COUNTRY, null),
            latitude = prefs.getFloat(KEY_LAT, 0f).toDouble(),
            longitude = prefs.getFloat(KEY_LON, 0f).toDouble(),
        )
    }

    /** Whether the user has opted in to daily high-pollen notifications. */
    var alertsEnabled: Boolean
        get() = prefs.getBoolean(KEY_ALERTS, false)
        set(value) = prefs.edit().putBoolean(KEY_ALERTS, value).apply()

    /** ISO date of the last day we already notified, to avoid duplicate alerts. */
    var lastAlertDate: String?
        get() = prefs.getString(KEY_LAST_ALERT_DATE, null)
        set(value) = prefs.edit().putString(KEY_LAST_ALERT_DATE, value).apply()

    private companion object {
        const val PREFS = "allergy_radar_prefs"
        const val KEY_NAME = "loc_name"
        const val KEY_ADMIN1 = "loc_admin1"
        const val KEY_COUNTRY = "loc_country"
        const val KEY_LAT = "loc_lat"
        const val KEY_LON = "loc_lon"
        const val KEY_ALERTS = "alerts_enabled"
        const val KEY_LAST_ALERT_DATE = "last_alert_date"
    }
}
