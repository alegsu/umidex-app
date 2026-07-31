package it.arpav.humidex.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.*
import it.arpav.humidex.db.AppDatabase
import it.arpav.humidex.db.HumidexEntity
import it.arpav.humidex.worker.HumidexSyncWorker
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val database = AppDatabase.getDatabase(application)
    private val dao = database.humidexDao()
    private val workManager = WorkManager.getInstance(application)

    val allRecords: StateFlow<List<HumidexEntity>> = dao.getAllRecords()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    init {
        setupPeriodicSync()
        // Aggiorna i dati immediatamente all'avvio
        triggerImmediateSync()
    }

    /** Avvia una sincronizzazione immediata (usato da pull-to-refresh e pulsante) */
    fun refresh() {
        triggerImmediateSync()
    }

    private fun triggerImmediateSync() {
        viewModelScope.launch {
            _isRefreshing.value = true
            val request = OneTimeWorkRequestBuilder<HumidexSyncWorker>()
                .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
                .build()

            workManager.enqueueUniqueWork(
                "HumidexImmediateSync",
                ExistingWorkPolicy.REPLACE,
                request
            )

            // Osserva lo stato del task per capire quando finisce
            workManager.getWorkInfoByIdLiveData(request.id).observeForever { info ->
                if (info != null && info.state.isFinished) {
                    _isRefreshing.value = false
                }
            }
        }
    }

    private fun setupPeriodicSync() {
        val workRequest = PeriodicWorkRequestBuilder<HumidexSyncWorker>(6, TimeUnit.HOURS)
            .build()
        workManager.enqueueUniquePeriodicWork(
            "HumidexSyncWork",
            ExistingPeriodicWorkPolicy.UPDATE,
            workRequest
        )
    }
}
