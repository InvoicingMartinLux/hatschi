package com.allergyradar.app.notifications

import android.content.Context
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.Calendar
import java.util.concurrent.TimeUnit

/** Schedules / cancels the recurring high-pollen check via WorkManager. */
object AlertScheduler {

    private const val PERIODIC_WORK = "pollen_daily_alert"
    private const val IMMEDIATE_WORK = "pollen_alert_now"

    fun setEnabled(context: Context, enabled: Boolean) {
        val workManager = WorkManager.getInstance(context)
        if (!enabled) {
            workManager.cancelUniqueWork(PERIODIC_WORK)
            return
        }

        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        // Daily check, first run aligned to the next morning.
        val periodic = PeriodicWorkRequestBuilder<PollenAlertWorker>(24, TimeUnit.HOURS)
            .setConstraints(constraints)
            .setInitialDelay(millisUntilNextMorning(), TimeUnit.MILLISECONDS)
            .build()
        workManager.enqueueUniquePeriodicWork(
            PERIODIC_WORK,
            ExistingPeriodicWorkPolicy.UPDATE,
            periodic,
        )

        // Also run an immediate check so the user sees today's status right away.
        val immediate = OneTimeWorkRequestBuilder<PollenAlertWorker>()
            .setConstraints(constraints)
            .build()
        workManager.enqueueUniqueWork(IMMEDIATE_WORK, ExistingWorkPolicy.REPLACE, immediate)
    }

    /** Milliseconds from now until the next 08:00 local time. */
    private fun millisUntilNextMorning(): Long {
        val now = Calendar.getInstance()
        val target = (now.clone() as Calendar).apply {
            set(Calendar.HOUR_OF_DAY, 8)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            if (before(now)) add(Calendar.DAY_OF_MONTH, 1)
        }
        return target.timeInMillis - now.timeInMillis
    }
}
