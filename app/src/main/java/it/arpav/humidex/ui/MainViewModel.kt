package it.arpav.humidex.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import it.arpav.humidex.db.AppDatabase
import it.arpav.humidex.db.HumidexEntity
import it.arpav.humidex.worker.HumidexSyncWorker
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import java.util.concurrent.TimeUnit

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val database = AppDatabase.getDatabase(application)
    private val dao = database.humidexDao()

    val allRecords: StateFlow<List<HumidexEntity>> = dao.getAllRecords()
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    init {
        setupPeriodicSync()
    }

    private fun setupPeriodicSync() {
        val workRequest = PeriodicWorkRequestBuilder<HumidexSyncWorker>(12, TimeUnit.HOURS)
            .build()
        
        WorkManager.getInstance(getApplication()).enqueueUniquePeriodicWork(
            "HumidexSyncWork",
            ExistingPeriodicWorkPolicy.KEEP,
            workRequest
        )
    }
}
