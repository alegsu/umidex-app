package it.arpav.humidex.worker

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import it.arpav.humidex.api.ArpavApiService
import it.arpav.humidex.db.AppDatabase
import it.arpav.humidex.db.HumidexEntity

class HumidexSyncWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            val apiService = ArpavApiService.create()
            val database = AppDatabase.getDatabase(applicationContext)
            
            // Fetch data
            val response = apiService.getHumidexData()
            val citiesOfInterest = listOf("Padova", "Volpago", "Maser", "Castelfranco")
            
            val recordsToInsert = response.data.filter { record ->
                citiesOfInterest.any { city ->
                    record.nome_stazione.contains(city, ignoreCase = true)
                }
            }.map { record ->
                HumidexEntity(
                    stationName = record.nome_stazione,
                    timestamp = record.dataora,
                    humidexValue = record.valore,
                    temperature = record.temp,
                    humidity = record.umid
                )
            }
            
            if (recordsToInsert.isNotEmpty()) {
                database.humidexDao().insertRecords(recordsToInsert)
                Log.d("HumidexSyncWorker", "Inserted ${recordsToInsert.size} records")
            }
            
            Result.success()
        } catch (e: Exception) {
            Log.e("HumidexSyncWorker", "Error fetching data", e)
            Result.retry()
        }
    }
}
