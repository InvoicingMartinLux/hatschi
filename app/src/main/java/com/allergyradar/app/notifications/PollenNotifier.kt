package com.allergyradar.app.notifications

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.allergyradar.app.MainActivity
import com.allergyradar.app.R
import com.allergyradar.app.data.DayForecast
import com.allergyradar.app.data.GeoLocation

/** Builds and posts the daily high-pollen notification. */
object PollenNotifier {

    const val CHANNEL_ID = "pollen_alerts"
    private const val NOTIFICATION_ID = 1001

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "High pollen alerts",
            NotificationManager.IMPORTANCE_DEFAULT,
        ).apply {
            description = "Notifies you when local pollen levels are high."
        }
        manager.createNotificationChannel(channel)
    }

    fun canPost(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED
    }

    @SuppressLint("MissingPermission") // guarded by canPost()
    fun showHighPollenAlert(context: Context, location: GeoLocation, day: DayForecast) {
        ensureChannel(context)
        if (!canPost(context)) return

        val triggers = day.activeReadings.take(3).joinToString(", ") {
            "${it.allergen.displayName} (${it.severity.label.lowercase()})"
        }
        val title = "${day.overall.label} pollen in ${location.name}"
        val body = buildString {
            append(day.overall.advice)
            if (triggers.isNotEmpty()) append("\nMain triggers: $triggers")
        }

        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingFlags = android.app.PendingIntent.FLAG_UPDATE_CURRENT or
            android.app.PendingIntent.FLAG_IMMUTABLE
        val pendingIntent = android.app.PendingIntent.getActivity(context, 0, intent, pendingFlags)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_pollen)
            .setContentTitle(title)
            .setContentText(day.overall.advice)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()

        NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    }
}
