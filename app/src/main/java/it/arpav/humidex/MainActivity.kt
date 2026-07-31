package it.arpav.humidex

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.patrykandpatrick.vico.compose.axis.horizontal.rememberBottomAxis
import com.patrykandpatrick.vico.compose.axis.vertical.rememberStartAxis
import com.patrykandpatrick.vico.compose.chart.Chart
import com.patrykandpatrick.vico.compose.chart.line.lineChart
import com.patrykandpatrick.vico.core.entry.entryModelOf
import it.arpav.humidex.db.HumidexEntity
import it.arpav.humidex.ui.MainViewModel

@OptIn(ExperimentalMaterial3Api::class)
class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    @OptIn(ExperimentalMaterial3Api::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize()
                ) {
                    Scaffold(
                        topBar = {
                            TopAppBar(
                                title = { Text("ARPAV Humidex") },
                                colors = TopAppBarDefaults.topAppBarColors(
                                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            )
                        }
                    ) { innerPadding ->
                        val records by viewModel.allRecords.collectAsState()
                        HumidexScreen(
                            modifier = Modifier.padding(innerPadding),
                            records = records
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun HumidexScreen(modifier: Modifier = Modifier, records: List<HumidexEntity>) {
    val groupedRecords = records.groupBy { it.stationName }

    if (groupedRecords.isEmpty()) {
        Box(modifier = modifier.fillMaxSize(), contentAlignment = androidx.compose.ui.Alignment.Center) {
            Text("Nessun dato disponibile. Attendi la sincronizzazione in background.")
        }
    } else {
        LazyColumn(
            modifier = modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(groupedRecords.entries.toList()) { (stationName, stationRecords) ->
                StationCard(stationName = stationName, records = stationRecords)
            }
        }
    }
}

@Composable
fun StationCard(stationName: String, records: List<HumidexEntity>) {
    val latest = records.lastOrNull()
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = stationName,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(8.dp))
            if (latest != null) {
                Text(text = "Ultimo aggiornamento: ${latest.timestamp}")
                Text(
                    text = "Humidex: ${latest.humidexValue ?: "N/D"}",
                    fontWeight = FontWeight.Medium,
                    fontSize = 18.sp
                )
                Text(text = "Temperatura: ${latest.temperature ?: "N/D"} °C")
                Text(text = "Umidità: ${latest.humidity ?: "N/D"} %")
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            // Render chart if we have data
            val validRecords = records.filter { it.humidexValue != null }
            if (validRecords.isNotEmpty()) {
                val chartEntries = validRecords.mapIndexed { index, entity ->
                    com.patrykandpatrick.vico.core.entry.FloatEntry(index.toFloat(), entity.humidexValue!!.toFloat())
                }
                if (chartEntries.isNotEmpty()) {
                    val chartModel = com.patrykandpatrick.vico.core.entry.entryModelOf(chartEntries)
                    Chart(
                        chart = lineChart(),
                        model = chartModel,
                        startAxis = rememberStartAxis(),
                        bottomAxis = rememberBottomAxis(),
                        modifier = Modifier.height(200.dp)
                    )
                }
            } else {
                Text(text = "Dati insufficienti per il grafico.")
            }
        }
    }
}
