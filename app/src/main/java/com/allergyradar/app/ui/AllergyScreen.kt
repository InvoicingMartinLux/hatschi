package com.allergyradar.app.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.allergyradar.app.data.AllergenReading
import com.allergyradar.app.data.DayForecast
import com.allergyradar.app.data.GeoLocation
import com.allergyradar.app.data.Severity
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AllergyScreen(viewModel: AllergyViewModel = viewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    LaunchedEffect(state.error) {
        state.error?.let { message ->
            snackbarHostState.showSnackbar(message)
            viewModel.dismissError()
        }
    }

    // --- Current-location (GPS) permission flow ---
    val locationPermissions = remember {
        arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
        )
    }
    fun hasLocationPermission() = locationPermissions.any {
        ContextCompat.checkSelfPermission(context, it) == PackageManager.PERMISSION_GRANTED
    }
    val locationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { grants ->
        if (grants.values.any { it }) {
            viewModel.useCurrentLocation()
        } else {
            scope.launch {
                snackbarHostState.showSnackbar(
                    "Location permission is needed to use your current position.",
                )
            }
        }
    }
    val onUseLocation: () -> Unit = {
        if (hasLocationPermission()) viewModel.useCurrentLocation()
        else locationPermissionLauncher.launch(locationPermissions)
    }

    // --- Daily notification permission flow ---
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) {
            viewModel.setAlertsEnabled(true)
        } else {
            scope.launch {
                snackbarHostState.showSnackbar(
                    "Enable notifications in system settings to receive pollen alerts.",
                )
            }
        }
    }
    val onToggleAlerts: (Boolean) -> Unit = { wantEnabled ->
        when {
            !wantEnabled -> viewModel.setAlertsEnabled(false)
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                ContextCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS,
                ) != PackageManager.PERMISSION_GRANTED ->
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            else -> viewModel.setAlertsEnabled(true)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "🌿  Allergy Radar",
                        fontWeight = FontWeight.Bold,
                    )
                },
                actions = {
                    if (state.forecast != null) {
                        IconButton(onClick = viewModel::refresh) {
                            Icon(Icons.Filled.Refresh, contentDescription = "Refresh")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    actionIconContentColor = MaterialTheme.colorScheme.onPrimary,
                ),
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) },
        containerColor = MaterialTheme.colorScheme.background,
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            SearchBar(
                query = state.query,
                isSearching = state.isSearching,
                onQueryChange = viewModel::onQueryChange,
                onSearch = viewModel::search,
            )

            ControlsBar(
                isLocating = state.isLocating,
                alertsEnabled = state.alertsEnabled,
                onUseLocation = onUseLocation,
                onToggleAlerts = onToggleAlerts,
            )

            AnimatedVisibility(visible = state.searchResults.isNotEmpty()) {
                LocationPicker(
                    results = state.searchResults,
                    onPick = viewModel::selectLocation,
                )
            }

            if (state.isLoadingForecast) {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }

            val forecast = state.forecast
            when {
                forecast != null -> ForecastContent(
                    location = forecast.location,
                    days = forecast.days,
                    selectedDayIndex = state.selectedDayIndex.coerceIn(0, forecast.days.lastIndex),
                    onSelectDay = viewModel::selectDay,
                )
                state.isLoadingForecast -> Unit
                else -> EmptyState()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SearchBar(
    query: String,
    isSearching: Boolean,
    onQueryChange: (String) -> Unit,
    onSearch: () -> Unit,
) {
    val keyboard = LocalSoftwareKeyboardController.current
    Surface(
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.fillMaxWidth(),
    ) {
        OutlinedTextField(
            value = query,
            onValueChange = onQueryChange,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            placeholder = { Text("Enter your address, city or postcode") },
            leadingIcon = { Icon(Icons.Filled.LocationOn, contentDescription = null) },
            trailingIcon = {
                if (isSearching) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(22.dp),
                        strokeWidth = 2.dp,
                    )
                } else {
                    IconButton(onClick = {
                        keyboard?.hide()
                        onSearch()
                    }) {
                        Icon(Icons.Filled.Search, contentDescription = "Search")
                    }
                }
            },
            singleLine = true,
            shape = RoundedCornerShape(14.dp),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = {
                keyboard?.hide()
                onSearch()
            }),
        )
    }
}

@Composable
private fun ControlsBar(
    isLocating: Boolean,
    alertsEnabled: Boolean,
    onUseLocation: () -> Unit,
    onToggleAlerts: (Boolean) -> Unit,
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 8.dp, end = 12.dp, top = 4.dp, bottom = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextButton(onClick = onUseLocation, enabled = !isLocating) {
                if (isLocating) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                    )
                } else {
                    Icon(
                        Icons.Filled.MyLocation,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp),
                    )
                }
                Spacer(Modifier.width(6.dp))
                Text(if (isLocating) "Locating…" else "Use my location")
            }

            Spacer(Modifier.weight(1f))

            Icon(
                Icons.Filled.Notifications,
                contentDescription = null,
                modifier = Modifier.size(18.dp),
                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
            )
            Spacer(Modifier.width(6.dp))
            Text(
                "Daily alerts",
                style = MaterialTheme.typography.labelLarge,
            )
            Spacer(Modifier.width(4.dp))
            Switch(checked = alertsEnabled, onCheckedChange = onToggleAlerts)
        }
    }
}

@Composable
private fun LocationPicker(
    results: List<GeoLocation>,
    onPick: (GeoLocation) -> Unit,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(modifier = Modifier.padding(vertical = 4.dp)) {
            Text(
                "Did you mean…",
                style = MaterialTheme.typography.labelMedium,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            )
            results.forEach { location ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onPick(location) }
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(
                        Icons.Filled.LocationOn,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(20.dp),
                    )
                    Spacer(Modifier.width(12.dp))
                    Text(location.displayName, style = MaterialTheme.typography.bodyLarge)
                }
            }
        }
    }
}

@Composable
private fun ForecastContent(
    location: GeoLocation,
    days: List<DayForecast>,
    selectedDayIndex: Int,
    onSelectDay: (Int) -> Unit,
) {
    val selectedDay = days[selectedDayIndex]
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Filled.LocationOn,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(20.dp),
                )
                Spacer(Modifier.width(6.dp))
                Text(
                    location.displayName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }

        item {
            DaySelector(
                days = days,
                selectedDayIndex = selectedDayIndex,
                onSelectDay = onSelectDay,
            )
        }

        item {
            OverallRiskCard(day = selectedDay)
        }

        item {
            Text(
                "Allergen breakdown",
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(top = 4.dp),
            )
        }

        items(selectedDay.readings) { reading ->
            AllergenRow(reading)
        }

        item {
            Text(
                "Pollen data from Open-Meteo. Levels are peak grains/m³ for the day; " +
                    "treat severity bands as guidance.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                modifier = Modifier.padding(top = 8.dp),
            )
        }
    }
}

@Composable
private fun DaySelector(
    days: List<DayForecast>,
    selectedDayIndex: Int,
    onSelectDay: (Int) -> Unit,
) {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        itemsIndexed(days) { index, day ->
            val selected = index == selectedDayIndex
            val container = if (selected) day.overall.color else MaterialTheme.colorScheme.surface
            val contentColor = if (selected) Color.White else MaterialTheme.colorScheme.onSurface
            Card(
                modifier = Modifier
                    .width(96.dp)
                    .clickable { onSelectDay(index) },
                colors = CardDefaults.cardColors(containerColor = container),
                elevation = CardDefaults.cardElevation(defaultElevation = if (selected) 4.dp else 1.dp),
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Text(
                        day.relativeLabel.ifEmpty { day.weekdayLabel },
                        style = MaterialTheme.typography.labelLarge,
                        color = contentColor,
                        fontWeight = FontWeight.SemiBold,
                    )
                    Spacer(Modifier.height(8.dp))
                    Box(
                        modifier = Modifier
                            .size(14.dp)
                            .background(
                                if (selected) Color.White else day.overall.color,
                                CircleShape,
                            ),
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        day.overall.label,
                        style = MaterialTheme.typography.labelSmall,
                        color = contentColor,
                        textAlign = TextAlign.Center,
                    )
                }
            }
        }
    }
}

@Composable
private fun OverallRiskCard(day: DayForecast) {
    val color = day.overall.color
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = color),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                day.relativeLabel.ifEmpty { day.weekdayLabel } + " · overall pollen",
                style = MaterialTheme.typography.labelLarge,
                color = Color.White.copy(alpha = 0.85f),
            )
            Spacer(Modifier.height(4.dp))
            Text(
                day.overall.label,
                fontSize = 40.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                day.overall.advice,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White.copy(alpha = 0.95f),
            )
            val active = day.activeReadings
            if (active.isNotEmpty()) {
                Spacer(Modifier.height(12.dp))
                Text(
                    "Main triggers: " + active.joinToString(", ") {
                        "${it.allergen.emoji} ${it.allergen.displayName}"
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.9f),
                )
            }
        }
    }
}

@Composable
private fun AllergenRow(reading: AllergenReading) {
    val severity = reading.severity
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(reading.allergen.emoji, fontSize = 24.sp)
            Spacer(Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    reading.allergen.displayName,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.SemiBold,
                )
                Spacer(Modifier.height(6.dp))
                SeverityBar(severity)
            }
            Spacer(Modifier.width(12.dp))
            Column(horizontalAlignment = Alignment.End) {
                SeverityPill(severity)
                Spacer(Modifier.height(4.dp))
                Text(
                    "${reading.peakValue.roundToInt()} /m³",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                )
            }
        }
    }
}

@Composable
private fun SeverityBar(severity: Severity) {
    // Five segments lit up to the current severity level.
    val litSegments = severity.ordinal // NONE = 0 lit, VERY_HIGH = 4 lit
    Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        for (i in 1..4) {
            val on = i <= litSegments
            Box(
                modifier = Modifier
                    .height(6.dp)
                    .width(34.dp)
                    .background(
                        if (on) severity.color
                        else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f),
                        RoundedCornerShape(3.dp),
                    ),
            )
        }
    }
}

@Composable
private fun SeverityPill(severity: Severity) {
    Surface(
        color = severity.color,
        shape = RoundedCornerShape(50),
    ) {
        Text(
            severity.label,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
        )
    }
}

@Composable
private fun EmptyState() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("🌼", fontSize = 64.sp)
            Spacer(Modifier.height(16.dp))
            Text(
                "Your local pollen forecast",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(8.dp))
            Text(
                "Enter your address above to see how strong hay-fever and other " +
                    "common allergens are today and over the next few days.",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                textAlign = TextAlign.Center,
            )
        }
    }
}
