package com.allergyradar.app.data

import android.annotation.SuppressLint
import android.content.Context
import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import android.os.Build
import android.os.CancellationSignal
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.IOException
import java.util.Locale
import kotlin.coroutines.resume

/**
 * Resolves the device's current GPS/network location into a [GeoLocation],
 * using Android's built-in [LocationManager] (no Google Play Services needed)
 * and [Geocoder] for a human-readable place name.
 *
 * Callers MUST hold a location permission before calling [currentLocation];
 * the UI requests it via the runtime permission flow.
 */
class LocationProvider(context: Context) {

    private val appContext = context.applicationContext

    @SuppressLint("MissingPermission")
    suspend fun currentLocation(): GeoLocation = withContext(Dispatchers.IO) {
        val manager = appContext.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            ?: throw IOException("Location services are unavailable on this device.")

        val location = lastKnownLocation(manager) ?: freshLocation(manager)
        ?: throw IOException("Couldn't get your location. Make sure location is turned on and try again.")

        reverseGeocode(location.latitude, location.longitude)
            ?: GeoLocation(
                name = "Current location",
                admin1 = null,
                country = null,
                latitude = location.latitude,
                longitude = location.longitude,
            )
    }

    @SuppressLint("MissingPermission")
    private fun lastKnownLocation(manager: LocationManager): Location? {
        val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
        return providers
            .filter { runCatching { manager.isProviderEnabled(it) }.getOrDefault(false) }
            .mapNotNull { runCatching { manager.getLastKnownLocation(it) }.getOrNull() }
            .maxByOrNull { it.time }
    }

    @SuppressLint("MissingPermission")
    private suspend fun freshLocation(manager: LocationManager): Location? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return null
        val provider = when {
            manager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
            manager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
            else -> return null
        }
        return suspendCancellableCoroutine { cont ->
            val signal = CancellationSignal()
            cont.invokeOnCancellation { signal.cancel() }
            manager.getCurrentLocation(
                provider,
                signal,
                ContextCompat.getMainExecutor(appContext),
            ) { location -> if (cont.isActive) cont.resume(location) }
        }
    }

    @Suppress("DEPRECATION")
    private suspend fun reverseGeocode(lat: Double, lon: Double): GeoLocation? {
        if (!Geocoder.isPresent()) return null
        val geocoder = Geocoder(appContext, Locale.getDefault())

        val address = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            suspendCancellableCoroutine { cont ->
                geocoder.getFromLocation(lat, lon, 1) { results ->
                    if (cont.isActive) cont.resume(results.firstOrNull())
                }
            }
        } else {
            runCatching { geocoder.getFromLocation(lat, lon, 1)?.firstOrNull() }.getOrNull()
        } ?: return null

        val place = address.locality
            ?: address.subAdminArea
            ?: address.adminArea
            ?: address.featureName
            ?: "Current location"
        return GeoLocation(
            name = place,
            admin1 = address.adminArea?.takeIf { it != place },
            country = address.countryName,
            latitude = lat,
            longitude = lon,
        )
    }
}
