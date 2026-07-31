package it.arpav.humidex.api

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET

data class HumidexResponse(
    val data: List<HumidexRecord>
)

data class HumidexRecord(
    val codice_stazione: Int,
    val nome_stazione: String,
    val valore: Double?,
    val temp: Double?,
    val umid: Double?,
    val dataora: String,
    val aggiornamento: String
)

interface ArpavApiService {
    @GET("meteo_indici?indice=humidex")
    suspend fun getHumidexData(): HumidexResponse

    companion object {
        private const val BASE_URL = "https://api.arpa.veneto.it/REST/v1/"

        fun create(): ArpavApiService {
            val retrofit = Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
            
            return retrofit.create(ArpavApiService::class.java)
        }
    }
}
