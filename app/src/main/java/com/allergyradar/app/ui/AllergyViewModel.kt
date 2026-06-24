package com.allergyradar.app.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.allergyradar.app.data.ForecastResult
import com.allergyradar.app.data.GeoLocation
import com.allergyradar.app.data.PollenRepository
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
    val searchResults: List<GeoLocation> = emptyList(),
    val isLoadingForecast: Boolean = false,
    val forecast: ForecastResult? = null,
    val selectedDayIndex: Int = 0,
    val error: String? = null,
)

class AllergyViewModel(app: Application) : AndroidViewModel(app) {

    private val repository = PollenRepository()
    private val prefs = app.getSharedPreferences(PREFS, Application.MODE_PRIVATE)

    private val _state = MutableStateFlow(AllergyUiState())
    val state: StateFlow<AllergyUiState> = _state.asStateFlow()

    private var searchJob: Job? = null

    init {
        loadSavedLocation()?.let { saved ->
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

    fun selectLocation(location: GeoLocation) {
        saveLocation(location)
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

    private fun saveLocation(location: GeoLocation) {
        prefs.edit()
            .putString(KEY_NAME, location.name)
            .putString(KEY_ADMIN1, location.admin1)
            .putString(KEY_COUNTRY, location.country)
            .putFloat(KEY_LAT, location.latitude.toFloat())
            .putFloat(KEY_LON, location.longitude.toFloat())
            .apply()
    }

    private fun loadSavedLocation(): GeoLocation? {
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

    private companion object {
        const val PREFS = "allergy_radar_prefs"
        const val KEY_NAME = "loc_name"
        const val KEY_ADMIN1 = "loc_admin1"
        const val KEY_COUNTRY = "loc_country"
        const val KEY_LAT = "loc_lat"
        const val KEY_LON = "loc_lon"
    }
}
