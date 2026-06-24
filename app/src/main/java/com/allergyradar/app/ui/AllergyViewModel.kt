package com.allergyradar.app.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.allergyradar.app.data.ForecastResult
import com.allergyradar.app.data.GeoLocation
import com.allergyradar.app.data.LocationProvider
import com.allergyradar.app.data.LocationStore
import com.allergyradar.app.data.PollenRepository
import com.allergyradar.app.notifications.AlertScheduler
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AllergyUiState(
    val query: String = "",
    val isSearching: Boolean = false,
    val isLocating: Boolean = false,
    val searchResults: List<GeoLocation> = emptyList(),
    val isLoadingForecast: Boolean = false,
    val forecast: ForecastResult? = null,
    val selectedDayIndex: Int = 0,
    val alertsEnabled: Boolean = false,
    val error: String? = null,
)

class AllergyViewModel(app: Application) : AndroidViewModel(app) {

    private val repository = PollenRepository()
    private val locationProvider = LocationProvider(app)
    private val store = LocationStore(app)

    private val _state = MutableStateFlow(AllergyUiState(alertsEnabled = store.alertsEnabled))
    val state: StateFlow<AllergyUiState> = _state.asStateFlow()

    private var searchJob: Job? = null

    init {
        store.loadLocation()?.let { saved ->
            _state.update { it.copy(query = saved.name) }
            loadForecast(saved)
        }
    }

    fun onQueryChange(value: String) {
        _state.update { it.copy(query = value) }
    }

    fun search() {
        val query = _state.value.query.trim()
        if (query.isEmpty()) return
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            _state.update { it.copy(isSearching = true, error = null, searchResults = emptyList()) }
            // Small debounce-friendly pause so rapid taps don't hammer the API.
            delay(150)
            runCatching { repository.searchLocations(query) }
                .onSuccess { results ->
                    when {
                        results.isEmpty() -> _state.update {
                            it.copy(
                                isSearching = false,
                                error = "No place found for \"$query\". Try a city or postcode.",
                            )
                        }
                        results.size == 1 -> {
                            _state.update { it.copy(isSearching = false) }
                            selectLocation(results.first())
                        }
                        else -> _state.update {
                            it.copy(isSearching = false, searchResults = results)
                        }
                    }
                }
                .onFailure { e ->
                    _state.update {
                        it.copy(
                            isSearching = false,
                            error = e.message ?: "Search failed. Check your connection.",
                        )
                    }
                }
        }
    }

    /**
     * Resolves the device's GPS location and loads its forecast. The caller is
     * responsible for ensuring a location permission has been granted first.
     */
    fun useCurrentLocation() {
        if (_state.value.isLocating) return
        viewModelScope.launch {
            _state.update { it.copy(isLocating = true, error = null, searchResults = emptyList()) }
            runCatching { locationProvider.currentLocation() }
                .onSuccess { location ->
                    _state.update { it.copy(isLocating = false) }
                    selectLocation(location)
                }
                .onFailure { e ->
                    _state.update {
                        it.copy(
                            isLocating = false,
                            error = e.message ?: "Couldn't determine your location.",
                        )
                    }
                }
        }
    }

    fun selectLocation(location: GeoLocation) {
        store.saveLocation(location)
        _state.update {
            it.copy(
                query = location.name,
                searchResults = emptyList(),
            )
        }
        loadForecast(location)
    }

    fun selectDay(index: Int) {
        _state.update { it.copy(selectedDayIndex = index) }
    }

    fun refresh() {
        _state.value.forecast?.location?.let { loadForecast(it) }
    }

    /** Enables/disables daily high-pollen notifications and (re)schedules work. */
    fun setAlertsEnabled(enabled: Boolean) {
        store.alertsEnabled = enabled
        _state.update { it.copy(alertsEnabled = enabled) }
        AlertScheduler.setEnabled(getApplication(), enabled)
        if (!enabled) store.lastAlertDate = null
    }

    fun dismissError() {
        _state.update { it.copy(error = null) }
    }

    private fun loadForecast(location: GeoLocation) {
        viewModelScope.launch {
            _state.update { it.copy(isLoadingForecast = true, error = null) }
            runCatching { repository.fetchForecast(location) }
                .onSuccess { result ->
                    _state.update {
                        it.copy(
                            isLoadingForecast = false,
                            forecast = result,
                            selectedDayIndex = 0,
                        )
                    }
                }
                .onFailure { e ->
                    _state.update {
                        it.copy(
                            isLoadingForecast = false,
                            error = e.message ?: "Could not load the forecast.",
                        )
                    }
                }
        }
    }
}
