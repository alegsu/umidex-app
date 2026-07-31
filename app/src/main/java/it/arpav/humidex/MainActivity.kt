package it.arpav.humidex

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.patrykandpatrick.vico.compose.axis.horizontal.rememberBottomAxis
import com.patrykandpatrick.vico.compose.axis.vertical.rememberStartAxis
import com.patrykandpatrick.vico.compose.chart.Chart
import com.patrykandpatrick.vico.compose.chart.line.lineChart
import com.patrykandpatrick.vico.compose.component.shape.shader.fromBrush
import com.patrykandpatrick.vico.core.axis.AxisPosition
import com.patrykandpatrick.vico.core.axis.formatter.AxisValueFormatter
import com.patrykandpatrick.vico.core.chart.line.LineChart
import com.patrykandpatrick.vico.core.component.shape.shader.DynamicShaders
import com.patrykandpatrick.vico.core.entry.FloatEntry
import com.patrykandpatrick.vico.core.entry.entryModelOf
import it.arpav.humidex.db.HumidexEntity
import it.arpav.humidex.ui.MainViewModel
import java.text.SimpleDateFormat
import java.util.Locale

// ─── Colori scuri del tema ──────────────────────────────────────────────────
val DarkBackground     = Color(0xFF0D1117)
val DarkSurface        = Color(0xFF161B22)
val DarkCard           = Color(0xFF1C2128)
val DarkCardBorder     = Color(0xFF30363D)
val TextPrimary        = Color(0xFFE6EDF3)
val TextSecondary      = Color(0xFF8B949E)
val AccentBlue         = Color(0xFF58A6FF)

// ─── Scala Humidex ──────────────────────────────────────────────────────────
val HumidexNone        = Color(0xFF4FC3F7)   // < 27  – Nessun disagio (azzurro)
val HumidexLight       = Color(0xFF81C784)   // 27-29 – Leggero (verde)
val HumidexSome        = Color(0xFFFFD54F)   // 30-39 – Qualche disagio (giallo)
val HumidexGreat       = Color(0xFFFF8A65)   // 40-45 – Grande disagio (arancio)
val HumidexDanger      = Color(0xFFEF5350)   // 46+   – Pericoloso (rosso)

fun humidexColor(value: Double?): Color = when {
    value == null       -> TextSecondary
    value < 27          -> HumidexNone
    value < 30          -> HumidexLight
    value < 40          -> HumidexSome
    value < 46          -> HumidexGreat
    else                -> HumidexDanger
}

fun humidexLabel(value: Double?): String = when {
    value == null       -> "N/D"
    value < 27          -> "Nessun disagio"
    value < 30          -> "Leggero disagio"
    value < 40          -> "Qualche disagio"
    value < 46          -> "Grande disagio"
    else                -> "⚠ Pericoloso"
}

// ─── Theme ──────────────────────────────────────────────────────────────────
@Composable
fun HumidexDarkTheme(content: @Composable () -> Unit) {
    val colorScheme = darkColorScheme(
        background    = DarkBackground,
        surface       = DarkSurface,
        primary       = AccentBlue,
        onBackground  = TextPrimary,
        onSurface     = TextPrimary,
    )
    MaterialTheme(colorScheme = colorScheme, content = content)
}

// ─── Activity ───────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = DarkBackground.toArgb()
        setContent {
            HumidexDarkTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = DarkBackground) {
                    Scaffold(
                        containerColor = DarkBackground,
                        topBar = {
                            TopAppBar(
                                title = {
                                    Column {
                                        Text(
                                            "ARPAV Humidex",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 20.sp,
                                            color = TextPrimary
                                        )
                                        Text(
                                            "Indice di disagio fisico · Veneto",
                                            fontSize = 12.sp,
                                            color = TextSecondary
                                        )
                                    }
                                },
                                colors = TopAppBarDefaults.topAppBarColors(
                                    containerColor = DarkSurface
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

// ─── Schermata principale ────────────────────────────────────────────────────
@Composable
fun HumidexScreen(modifier: Modifier = Modifier, records: List<HumidexEntity>) {
    val groupedRecords = records.groupBy { it.stationName }

    if (groupedRecords.isEmpty()) {
        Box(
            modifier = modifier.fillMaxSize().background(DarkBackground),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = AccentBlue)
                Spacer(Modifier.height(16.dp))
                Text(
                    "Sincronizzazione in corso…",
                    color = TextSecondary,
                    fontSize = 14.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
    } else {
        LazyColumn(
            modifier = modifier.fillMaxSize().background(DarkBackground),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(groupedRecords.entries.toList()) { (stationName, stationRecords) ->
                StationCard(stationName = stationName, records = stationRecords)
            }
        }
    }
}

// ─── Card stazione ───────────────────────────────────────────────────────────
@Composable
fun StationCard(stationName: String, records: List<HumidexEntity>) {
    val latest = records.lastOrNull()
    val hx = latest?.humidexValue
    val hxColor by animateColorAsState(
        targetValue = humidexColor(hx),
        animationSpec = tween(600),
        label = "humidexColor"
    )

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCard),
        elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {

            // ── Intestazione ────────────────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = stationName,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    if (latest != null) {
                        Text(
                            text = latest.timestamp,
                            fontSize = 11.sp,
                            color = TextSecondary
                        )
                    }
                }
                // Badge valore humidex
                if (hx != null) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(hxColor.copy(alpha = 0.18f))
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "%.1f".format(hx),
                            fontSize = 26.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = hxColor
                        )
                    }
                }
            }

            Spacer(Modifier.height(12.dp))

            // ── Etichetta disagio ────────────────────────────────────────────
            if (hx != null) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(hxColor.copy(alpha = 0.12f))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = humidexLabel(hx),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = hxColor
                    )
                }
                Spacer(Modifier.height(12.dp))
            }

            // ── Temperatura / Umidità ────────────────────────────────────────
            if (latest != null) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    StatChip(
                        label = "Temperatura",
                        value = latest.temperature?.let { "%.1f °C".format(it) } ?: "N/D"
                    )
                    StatChip(
                        label = "Umidità",
                        value = latest.humidity?.let { "%.0f %%".format(it) } ?: "N/D"
                    )
                }
                Spacer(Modifier.height(16.dp))
            }

            // ── Grafico storico ──────────────────────────────────────────────
            val validRecords = records.filter { it.humidexValue != null }
            if (validRecords.size >= 2) {
                Text("Storico", fontSize = 12.sp, color = TextSecondary, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.height(8.dp))

                // Formatta le etichette timestamp per l'asse X
                val inputFmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault())
                val shortFmt = SimpleDateFormat("dd/MM HH:mm", Locale.getDefault())
                val labels = validRecords.map { entity ->
                    try { shortFmt.format(inputFmt.parse(entity.timestamp)!!) }
                    catch (_: Exception) { entity.timestamp.take(10) }
                }

                // Mostra solo N etichette per non sovraffollare l'asse X
                val maxLabels = 4
                val step = maxOf(1, labels.size / maxLabels)
                val dateFormatter = AxisValueFormatter<AxisPosition.Horizontal.Bottom> { value, _ ->
                    val idx = value.toInt().coerceIn(0, labels.lastIndex)
                    if (idx % step == 0) labels[idx] else ""
                }

                val chartEntries = validRecords.mapIndexed { index, entity ->
                    FloatEntry(index.toFloat(), entity.humidexValue!!.toFloat())
                }
                val chartModel = entryModelOf(chartEntries)

                // Gradiente orizzontale che cambia colore secondo la scala Humidex punto per punto
                val perPointColors = validRecords.map { humidexColor(it.humidexValue) }
                val gradientColors = if (perPointColors.distinct().size == 1)
                    listOf(perPointColors.first(), perPointColors.first())
                else perPointColors

                val lineSpec = LineChart.LineSpec(
                    lineColor = hxColor.toArgb(),
                    lineBackgroundShader = DynamicShaders.fromBrush(
                        Brush.horizontalGradient(colors = gradientColors.map { it.copy(alpha = 0.55f) })
                    )
                )

                Chart(
                    chart = lineChart(lines = listOf(lineSpec)),
                    model = chartModel,
                    startAxis = rememberStartAxis(),
                    bottomAxis = rememberBottomAxis(valueFormatter = dateFormatter),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(DarkBackground)
                        .padding(8.dp)
                )
            } else {
                Text(
                    text = "Non ancora abbastanza dati per il grafico storico",
                    fontSize = 12.sp,
                    color = TextSecondary,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}


// ─── Chip dati meteo ─────────────────────────────────────────────────────────
@Composable
fun StatChip(label: String, value: String) {
    Column(
        modifier = Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(DarkBackground)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Text(label, fontSize = 11.sp, color = TextSecondary)
        Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
    }
}
