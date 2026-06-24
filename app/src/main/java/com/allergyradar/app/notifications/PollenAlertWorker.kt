package com.allergyradar.app.notifications

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.allergyradar.app.data.LocationStore
import com.allergyradar.app.data.PollenRepository
import com.allergyradar.app.data.Severity

/**
 * Periodically checks the saved location's pollen forecast and posts a
 * notification when today's overall level is High or worse. De-duplicates by
 * date so the user is alerted at most once per day.
 */
class PollenAlertWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result {
        val store = LocationStore(applicationContext)
        if (!store.alertsEnabled) return Result.success()

        val location = store.loadLocation() ?: return Result.success()

        val forecast = runCatching {
            PollenRepository().fetchForecast(location, forecastDays = 1)
        }.getOrElse { return Result.retry() }

        val today = forecast.days.firstOrNull() ?: return Result.success()

        if (today.overall.ordinal >= Severity.HIGH.ordinal && store.lastAlertDate != today.isoDate) {
            PollenNotifier.showHighPollenAlert(applicationContext, location, today)
            store.lastAlertDate = today.isoDate
        }

        return Result.success()
    }
}
