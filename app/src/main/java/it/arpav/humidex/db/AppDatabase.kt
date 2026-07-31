package it.arpav.humidex.db

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "humidex_records", primaryKeys = ["stationName", "timestamp"])
data class HumidexEntity(
    val stationName: String,
    val timestamp: String,
    val humidexValue: Double?,
    val temperature: Double?,
    val humidity: Double?
)

@Dao
interface HumidexDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecords(records: List<HumidexEntity>)

    @Query("SELECT * FROM humidex_records WHERE stationName = :stationName ORDER BY timestamp ASC")
    fun getRecordsForStation(stationName: String): Flow<List<HumidexEntity>>

    @Query("SELECT * FROM humidex_records ORDER BY timestamp ASC")
    fun getAllRecords(): Flow<List<HumidexEntity>>
    
    @Query("SELECT * FROM humidex_records WHERE timestamp = (SELECT MAX(timestamp) FROM humidex_records WHERE stationName = :stationName) AND stationName = :stationName")
    fun getLatestRecordForStation(stationName: String): Flow<HumidexEntity?>
}

@Database(entities = [HumidexEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun humidexDao(): HumidexDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "humidex_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
