package it.arpav.humidex

import android.graphics.Paint as AndroidPaint
import android.graphics.Typeface
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshContainer
import androidx.compose.material3.pulltorefresh.rememberPullToRefreshState
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.input.nestedscroll.nestedScroll
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import it.arpav.humidex.db.HumidexEntity
import it.arpav.humidex.ui.MainViewModel
import java.text.SimpleDateFormat
import java.util.Locale

// ─── Colori ─────────────────────────────────────────────────────────────────
val DarkBackground  = Color(0xFF0D1117)
val DarkSurface     = Color(0xFF161B22)
val DarkCard        = Color(0xFF1C2128)
val TextPrimary     = Color(0xFFE6EDF3)
val TextSecondary   = Color(0xFF8B949E)
val AccentBlue      = Color(0xFF58A6FF)

val HumidexNone     = Color(0xFF4FC3F7)   // < 27
val HumidexLight    = Color(0xFF81C784)   // 27–29
val HumidexSome     = Color(0xFFFFD54F)   // 30–39
val HumidexGreat    = Color(0xFFFF8A65)   // 40–45
val HumidexDanger   = Color(0xFFEF5350)   // ≥ 46

fun humidexColor(value: Double?): Color = when {
    value == null -> TextSecondary
    value < 27    -> HumidexNone
    value < 30    -> HumidexLight
    value < 40    -> HumidexSome
    value < 46    -> HumidexGreat
    else          -> HumidexDanger
}

fun humidexLabel(value: Double?): String = when {
    value == null -> "N/D"
    value < 27    -> "Nessun disagio"
    value < 30    -> "Leggero disagio"
    value < 40    -> "Qualche disagio"
    value < 46    -> "Grande disagio"
    else          -> "⚠ Pericoloso"
}

// ─── Tema scuro ──────────────────────────────────────────────────────────────
@Composable
fun HumidexDarkTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = darkColorScheme(
            background   = DarkBackground,
            surface      = DarkSurface,
            primary      = AccentBlue,
            onBackground = TextPrimary,
            onSurface    = TextPrimary,
        ),
        content = content
    )
}

// ─── Activity ────────────────────────────────────────────────────────────────
@OptIn(ExperimentalMaterial3Api::class)
class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = DarkBackground.toArgb()
        setContent {
            HumidexDarkTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = DarkBackground) {
                    val isRefreshing by viewModel.isRefreshing.collectAsState()
                    val pullState  = rememberPullToRefreshState()

                    // Triggera refresh quando l'utente fa pull
                    if (pullState.isRefreshing) {
                        LaunchedEffect(Unit) { viewModel.refresh() }
                    }
                    // Togli lo spinner quando il ViewModel ha finito
                    LaunchedEffect(isRefreshing) {
                        if (!isRefreshing) pullState.endRefresh()
                    }

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
                                actions = {
                                    IconButton(onClick = { viewModel.refresh() }) {
                                        if (isRefreshing) {
                                            CircularProgressIndicator(
                                                modifier = Modifier.size(20.dp),
                                                color    = AccentBlue,
                                                strokeWidth = 2.dp
                                            )
                                        } else {
                                            Text(
                                                "↻",
                                                fontSize = 22.sp,
                                                color = AccentBlue,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                    }
                                },
                                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkSurface)
                            )
                        }
                    ) { innerPadding ->
                        Box(
                            Modifier
                                .padding(innerPadding)
                                .nestedScroll(pullState.nestedScrollConnection)
                        ) {
                            val records by viewModel.allRecords.collectAsState()
                            HumidexScreen(records = records)
                            PullToRefreshContainer(
                                state            = pullState,
                                modifier         = Modifier.align(Alignment.TopCenter),
                                containerColor   = DarkSurface,
                                contentColor     = AccentBlue
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─── Schermata principale ────────────────────────────────────────────────────
@Composable
fun HumidexScreen(records: List<HumidexEntity>) {
    val grouped = records.groupBy { it.stationName }
    if (grouped.isEmpty()) {
        Box(Modifier.fillMaxSize().background(DarkBackground), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                CircularProgressIndicator(color = AccentBlue)
                Spacer(Modifier.height(16.dp))
                Text("Sincronizzazione in corso…", color = TextSecondary, fontSize = 14.sp)
            }
        }
    } else {
        LazyColumn(
            modifier.fillMaxSize().background(DarkBackground),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            items(grouped.entries.toList()) { (name, recs) ->
                StationCard(stationName = name, records = recs)
            }
        }
    }
}

// ─── Card stazione ───────────────────────────────────────────────────────────
@Composable
fun StationCard(stationName: String, records: List<HumidexEntity>) {
    val latest = records.lastOrNull()
    val hx     = latest?.humidexValue
    val hxColor by animateColorAsState(humidexColor(hx), tween(600), label = "hxColor")

    Card(
        Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkCard),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Column(Modifier.padding(20.dp)) {

            // ── Intestazione ────────────────────────────────────────────────
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(Modifier.weight(1f)) {
                    Text(stationName, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
                    if (latest != null) {
                        val fmtIn  = remember { SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()) }
                        val fmtOut = remember { SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()) }
                        val ts = try { fmtOut.format(fmtIn.parse(latest.timestamp)!!) }
                                 catch (_: Exception) { latest.timestamp }
                        Text(ts, fontSize = 11.sp, color = TextSecondary)
                    }
                }
                if (hx != null) {
                    Box(
                        Modifier.clip(RoundedCornerShape(12.dp))
                            .background(hxColor.copy(alpha = 0.18f))
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("%.1f".format(hx), fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = hxColor)
                    }
                }
            }

            Spacer(Modifier.height(10.dp))

            // ── Etichetta disagio ────────────────────────────────────────────
            if (hx != null) {
                Box(
                    Modifier.clip(RoundedCornerShape(8.dp))
                        .background(hxColor.copy(alpha = 0.12f))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(humidexLabel(hx), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = hxColor)
                }
                Spacer(Modifier.height(12.dp))
            }

            // ── Temperatura / Umidità ────────────────────────────────────────
            if (latest != null) {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    StatChip("Temperatura", latest.temperature?.let { "%.1f °C".format(it) } ?: "N/D")
                    StatChip("Umidità",     latest.humidity?.let { "%.0f%%".format(it) } ?: "N/D")
                }
                Spacer(Modifier.height(20.dp))
            }

            // ── Grafico ──────────────────────────────────────────────────────
            val validRecords = records.filter { it.humidexValue != null }
            if (validRecords.size >= 2) {
                Text(
                    "Storico  ·  tocca una barra per i dettagli",
                    fontSize = 11.sp, color = TextSecondary, fontWeight = FontWeight.SemiBold
                )
                Spacer(Modifier.height(8.dp))
                HumidexBarChart(records = validRecords)
            } else {
                Text(
                    "Non ancora abbastanza dati per il grafico storico",
                    fontSize = 12.sp, color = TextSecondary, textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

// ─── Grafico a barre custom ──────────────────────────────────────────────────
@Composable
fun HumidexBarChart(records: List<HumidexEntity>, modifier: Modifier = Modifier) {
    var selectedIndex by remember { mutableStateOf<Int?>(null) }

    val fmtIn      = remember { SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.getDefault()) }
    val fmtTooltip = remember { SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()) }
    val fmtXAxis   = remember { SimpleDateFormat("dd/MM\nHH:mm", Locale.getDefault()) }

    val minY    = 10f
    val maxY    = 55f
    val range   = maxY - minY

    // Soglie di riferimento
    val thresholds = listOf(
        27f to HumidexLight,
        30f to HumidexSome,
        40f to HumidexGreat,
        46f to HumidexDanger
    )

    Column(modifier.fillMaxWidth()) {

        // ── Canvas ──────────────────────────────────────────────────────────
        Box(
            Modifier
                .fillMaxWidth()
                .height(240.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Color(0xFF0A0E14))
        ) {
            Canvas(
                Modifier
                    .fillMaxSize()
                    .pointerInput(records) {
                        detectTapGestures { offset ->
                            val leftPad  = 52f
                            val botPad   = 52f
                            val chartW   = size.width - leftPad - 8f
                            if (offset.x < leftPad) return@detectTapGestures
                            val barW = chartW / records.size.toFloat()
                            val idx  = ((offset.x - leftPad) / barW).toInt()
                                .coerceIn(0, records.lastIndex)
                            selectedIndex = if (selectedIndex == idx) null else idx
                        }
                    }
            ) {
                val leftPad  = 52f
                val botPad   = 52f
                val topPad   = 12f
                val rightPad = 8f
                val chartW   = size.width  - leftPad - rightPad
                val chartH   = size.height - botPad  - topPad
                val barW     = chartW / records.size.toFloat()

                val yAxisPaint = AndroidPaint().apply {
                    color     = TextSecondary.toArgb()
                    textSize  = 28f
                    textAlign = AndroidPaint.Align.RIGHT
                    typeface  = Typeface.MONOSPACE
                    isAntiAlias = true
                }
                val xAxisPaint = AndroidPaint().apply {
                    color     = TextSecondary.toArgb()
                    textSize  = 24f
                    textAlign = AndroidPaint.Align.CENTER
                    isAntiAlias = true
                }
                val threshLabelPaint = AndroidPaint().apply {
                    textSize  = 22f
                    textAlign = AndroidPaint.Align.LEFT
                    isAntiAlias = true
                }

                // ── Righe orizzontali di soglia ──────────────────────────────
                thresholds.forEach { (value, color) ->
                    val y = topPad + chartH - ((value - minY) / range * chartH)
                    if (y in topPad..(topPad + chartH)) {
                        drawLine(
                            color = color.copy(alpha = 0.35f),
                            start = Offset(leftPad, y),
                            end   = Offset(leftPad + chartW, y),
                            strokeWidth = 1.5f
                        )
                        // Etichetta soglia
                        threshLabelPaint.color = color.copy(alpha = 0.75f).toArgb()
                        drawContext.canvas.nativeCanvas.drawText(
                            value.toInt().toString(),
                            leftPad + chartW + 2f,
                            y + 8f,
                            threshLabelPaint
                        )
                    }
                }

                // ── Linea base Y ────────────────────────────────────────────
                drawLine(
                    color = TextSecondary.copy(alpha = 0.3f),
                    start = Offset(leftPad, topPad + chartH),
                    end   = Offset(leftPad + chartW, topPad + chartH),
                    strokeWidth = 1f
                )
                drawLine(
                    color = TextSecondary.copy(alpha = 0.2f),
                    start = Offset(leftPad, topPad),
                    end   = Offset(leftPad, topPad + chartH),
                    strokeWidth = 1f
                )

                // ── Etichette asse Y ────────────────────────────────────────
                listOf(10f, 20f, 30f, 40f, 50f).forEach { val yVal = yVal@it
                    val y = topPad + chartH - ((yVal - minY) / range * chartH)
                    if (y >= topPad) {
                        drawContext.canvas.nativeCanvas.drawText(
                            yVal.toInt().toString(), leftPad - 6f, y + 9f, yAxisPaint
                        )
                        drawLine(
                            color = TextSecondary.copy(alpha = 0.08f),
                            start = Offset(leftPad, y),
                            end   = Offset(leftPad + chartW, y),
                            strokeWidth = 1f
                        )
                    }
                }

                // ── Barre ───────────────────────────────────────────────────
                val maxLabels = 6
                val labelStep = maxOf(1, records.size / maxLabels)

                records.forEachIndexed { i, record ->
                    val hx      = record.humidexValue!!.toFloat()
                    val barColor = humidexColor(record.humidexValue)
                    val barH    = ((hx - minY) / range * chartH).coerceAtLeast(4f)
                    val x       = leftPad + i * barW + 1.5f
                    val y       = topPad + chartH - barH
                    val w       = (barW - 3f).coerceAtLeast(2f)
                    val isSel   = selectedIndex == i

                    // Sfondo selezione
                    if (isSel) {
                        drawRoundRect(
                            color        = barColor.copy(alpha = 0.15f),
                            topLeft      = Offset(x - 2f, topPad),
                            size         = Size(w + 4f, chartH),
                            cornerRadius = CornerRadius(4f, 4f)
                        )
                    }

                    // Barra
                    drawRoundRect(
                        color        = if (isSel) barColor else barColor.copy(alpha = 0.72f),
                        topLeft      = Offset(x, y),
                        size         = Size(w, barH),
                        cornerRadius = CornerRadius(3f, 3f)
                    )

                    // Etichette asse X (date/ore)
                    if (i % labelStep == 0 || i == records.lastIndex) {
                        val label = try { fmtXAxis.format(fmtIn.parse(record.timestamp)!!) }
                                    catch (_: Exception) { record.timestamp.take(5) }
                        val xCenter = leftPad + (i + 0.5f) * barW
                        val lines   = label.split("\n")
                        lines.forEachIndexed { li, line ->
                            drawContext.canvas.nativeCanvas.drawText(
                                line,
                                xCenter,
                                topPad + chartH + 18f + li * 26f,
                                xAxisPaint
                            )
                        }
                    }
                }
            }
        }

        // ── Tooltip tap ─────────────────────────────────────────────────────
        selectedIndex?.let { idx ->
            val rec = records.getOrNull(idx) ?: return@let
            Spacer(Modifier.height(10.dp))
            val hxCol = humidexColor(rec.humidexValue)
            val ts = try { fmtTooltip.format(fmtIn.parse(rec.timestamp)!!) }
                     catch (_: Exception) { rec.timestamp }

            Card(
                Modifier.fillMaxWidth(),
                shape  = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurface)
            ) {
                Row(
                    Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment     = Alignment.CenterVertically
                ) {
                    Column {
                        Text(ts, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                        Spacer(Modifier.height(4.dp))
                        Text(
                            "Temperatura: ${rec.temperature?.let { "%.1f °C".format(it) } ?: "N/D"}",
                            fontSize = 12.sp, color = TextSecondary
                        )
                        Text(
                            "Umidità: ${rec.humidity?.let { "%.0f%%".format(it) } ?: "N/D"}",
                            fontSize = 12.sp, color = TextSecondary
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            "%.1f".format(rec.humidexValue),
                            fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = hxCol
                        )
                        Text(humidexLabel(rec.humidexValue), fontSize = 11.sp, color = hxCol)
                    }
                }
            }
        }

        // ── Legenda soglie ───────────────────────────────────────────────────
        Spacer(Modifier.height(12.dp))
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            LegendChip(HumidexNone,   "< 27 Nessuno")
            LegendChip(HumidexSome,   "30-39 Qualche")
            LegendChip(HumidexGreat,  "40-45 Grande")
            LegendChip(HumidexDanger, "≥ 46 ⚠")
        }
    }
}

@Composable
fun RowScope.LegendChip(color: Color, label: String) {
    Row(
        Modifier
            .weight(1f)
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 6.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center
    ) {
        Box(
            Modifier
                .size(8.dp)
                .clip(RoundedCornerShape(2.dp))
                .background(color)
        )
        Spacer(Modifier.width(4.dp))
        Text(label, fontSize = 9.sp, color = color, fontWeight = FontWeight.SemiBold, maxLines = 1)
    }
}

// ─── Chip meteo ──────────────────────────────────────────────────────────────
@Composable
fun StatChip(label: String, value: String) {
    Column(
        Modifier
            .clip(RoundedCornerShape(10.dp))
            .background(DarkBackground)
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Text(label, fontSize = 11.sp, color = TextSecondary)
        Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
    }
}
