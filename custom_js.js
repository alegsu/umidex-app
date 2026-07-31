/**
 * pagina degli indici climatici 'humidex', 'scharlau', 'thom', 'windchill'
 * 
 * Autore: Filippo Turetta - ARPAV www.arpa.veneto.it
 * Script in licenza CC BY-NC-SA 3.0 IT
 * https://creativecommons.org/licenses/by-nc-sa/3.0/it/deed.it
 * 
 * Dati forniti da ARPAV in licenza CC BY 3.0
 * https://creativecommons.org/licenses/by/3.0/deed.it 
 * 
 * 
 * 17/07/2025 filippo start version
 * 18/07/2025 filippo miglioramenti sulla tabella delle stazioni e indicazioni di Domenichini
 * 31/07/2025 filippo cambiato il formato della tabella sotto alla mappa
 * 08/08/2025 filippo aggiunte le spiegazioni come da mail di oggi di Dmomenichini
 * 02/09/2025 filippo implementate le modifiche come da mail di oggi di Giovanna
 * 05/09/2025 filippo nascosto l'unico pulsante che era visibile. come da mail di oggi di Giovanna
 * 26/05/2026 filippo colorato il pallino di grigio quando il valore è null
 *
 */

// flag per avere i console.log attivi oppure no
const DEBUG = false;

// distanza, in gradi, fra stazioni per spostare la label della stazione
const DISTANZA_STAZ = 0.0009;

// numero di minuti per il cambio dell'ora 0
const MINUTI_CAMBIO_ORA0 = 15;

// costanti per la dimensione delle linee e dei pallini nei grafici
const DeskLineWidth = 2;
const MobileLineWidth = 0.5;

const DeskPointWidth = 2;
const MobilePointWidth = 0.5;

const GRIGIO = 'rgb(200,200,200)';


// elenco dei sensori visualizzati 'humidex', 'scharlau', 'thom', 'windchill'
const pulsanti = [];
pulsanti['humidex'] = { pulsante: 'Humidex', coordcd: 18, targa: 'humidex', unitaMis: ''};
// pulsanti['windchill'] = { pulsante: 'Windchill', coordcd: 18, targa: 'windchill', unitaMis: ''};     // 31/07/2025 da mettere su pagina dedicata
// pulsanti['thom'] = { pulsante: 'Thom', coordcd: 18, targa: 'thom', unitaMis: ''};
// pulsanti['scharlau'] = { pulsante: 'Scharlau', coordcd: 18, targa: 'scharlau', unitaMis: ''};

const spiegazioni = [];
spiegazioni['humidex'] = "\
L'indice Humidex di temperatura percepita è calcolato a partire dai dati di \
temperatura e umidità relativa registrati a due metri dal suolo dalle stazioni \
ARPAV. I dati sono forniti su base oraria.<br>\
Questo indice è uno dei metodi usati per rappresentare la percezione da parte \
del corpo umano dell'effetto combinato della temperatura reale e dell'umidità \
presente nell'aria; pertanto può essere interpretato come una sorta di “correzione” alla \
temperatura dell'aria connessa al valore dell'umidità presente.<br>\
Approfondimenti disponibili a <a href='https://en.wikipedia.org/wiki/Humidex' target='_blank'>questa pagina</a>.\
";

spiegazioni['windchill'] = "";

spiegazioni['thom'] = "\
L'indice di Thom di disagio fisico o “Discomfort Index” è calcolato a partire dai \
dati di temperatura e umidità relativa registrati a 2 metri dal suolo dalle \
stazioni ARPAV. I dati sono forniti su base oraria.<br>\
Questo indice rappresenta il disagio fisico percepito dal corpo umano e \
prodotto dalla combinazione della temperatura reale con l'umidità presente \
nell'aria, espresso con una scala di intensità.\
";

spiegazioni['scharlau'] = "\
L'indice di Scharlau è un indice bioclimatico che stima il livello di disagio fisico \
calcolato a partire dai dati di temperatura e umidità relativa registrati a 2 metri \
dal suolo dalle stazioni ARPAV. I dati sono forniti su base oraria.<br>\
Questo indice rappresenta il disagio fisico percepito dal corpo umano prodotto \
dalla combinazione della temperatura reale con l'umidità presente nell'aria, \
espresso in classi di intensità. Tale indice è stato determinato \
sperimentalmente, definendo una curva (detta di Scharlau) su un diagramma \
cartesiano che rappresenta le diverse combinazioni di temperatura e umidità.\
";


// flag per mettere i pulsanti del cambio degli orari
// ATTENZIONE che la brillanza NON ha orario
const btnOrari = false;     // 17/07/2025 al momento non metto i pulsanti di cambio orario
const orari = [
    {targa : 'OrarioPrec', passo : -1, pulsante : 
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-left" viewBox="0 0 16 16"> \
            <path fill-rule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/> \
        </svg> Ora Prec'},
    {targa : 'OrarioSucc', passo : 1, pulsante : 
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-right" viewBox="0 0 16 16"> \
            <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/> \
        </svg> Ora Succ'},
    {targa : 'OrarioAdesso', passo : 0, pulsante : 
        '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chevron-bar-right" viewBox="0 0 16 16"> \
            <path fill-rule="evenodd" d="M4.146 3.646a.5.5 0 0 0 0 .708L7.793 8l-3.647 3.646a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708 0zM11.5 1a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-1 0v-13a.5.5 0 0 1 .5-.5z"/> \
        </svg> Adesso'}
];


// pulsante premuto
var currentBtn;
var currentOrario = 0;

// stazioni sulla mappa in base alla presenza dell'indice nel periodo
var StazioniMappa = [];
var DataOraInizio;
var DataOraFine;

// link per recuperare le stazioni per sensore
// https://api.arpa.veneto.it/REST/v1/meteo_indici?indice=
const lnkStazioni = 'https://api.arpa.veneto.it/REST/v1/meteo_indici?indice=';

// simbolo punto della stazione
const pointDimension = 8;
const colorFill = 'rgb(0, 200, 0)';
const colorLine = 'rgb(0, 0, 0)';
const sfondoEtichetta = 'rgb(240,255,255)';
const fontStz = '14px "Titillium Web", Geneva, Tahoma, sans-serif'; 

// colore di fondo del pulsante selezionato
const btnBackgroundColor = 'skyblue';

//------------------------------------------------------------------------------

/**
if($parametro=="scharlau") {
if($value=="") return "rgba(255, 255, 255, 1)";
if($value>=0) return "rgba(0, 255, 0, 1)";
if($value<0 && $value>=-1) return "rgba(255, 245, 0, 1)";
if($value<-1 && $value>=-3) return "rgba(255, 170, 0, 1)";
if($value<-3) return "rgba(255, 0, 0, 1)";
}
*/
var rampScharlau = [];
rampScharlau.push( { 'min':-99, 'max': -3, 'R': 255, 'G':   0, 'B':   0, 'color': 'black' } );
rampScharlau.push( { 'min': -3, 'max': -1, 'R': 255, 'G': 170, 'B':   0, 'color': 'black' } );
rampScharlau.push( { 'min': -1, 'max':  0, 'R': 255, 'G': 245, 'B':   0, 'color': 'black' } );
rampScharlau.push( { 'min':  0, 'max': 99, 'R':   0, 'G': 255, 'B':   0, 'color': 'black' } );



/*
if($parametro=="humidex") {
if($value=="") return "#ffffff";
if($value>=45) return "rgba(129, 14, 180, 1);color:#ffffff";
if($value<45 && $value>=40) return "rgba(254, 1, 252, 1);color:#ffffff";
if($value<40 && $value>=35) return "rgba(255, 9, 0, 1);color:#ffffff";
if($value<35 && $value>=30) return "rgba(255, 170, 0, 1)";
if($value<30 && $value>=27) return "rgba(254, 245, 6, 1)";
if($value<27) return "#00ff00";
}
*/
var rampHumidex = [];
rampHumidex.push( { 'min':-99, 'max': 27, 'R':   0, 'G': 255, 'B':   0, 'color': 'black' } );
rampHumidex.push( { 'min': 27, 'max': 30, 'R': 254, 'G': 245, 'B':   6, 'color': 'black' } );
rampHumidex.push( { 'min': 30, 'max': 35, 'R': 254, 'G': 170, 'B':   0, 'color': 'black' } );
rampHumidex.push( { 'min': 35, 'max': 40, 'R': 255, 'G':   9, 'B':   0, 'color': 'black' } );
rampHumidex.push( { 'min': 40, 'max': 45, 'R': 254, 'G':   1, 'B': 252, 'color': 'black' } );
rampHumidex.push( { 'min': 45, 'max': 99, 'R': 129, 'G':  14, 'B': 180, 'color': 'black' } );


/**
if($parametro=="thom") {
if($value=="") return "#ffffff";
if($value>=32) return "rgba(129, 14, 180, 1)";
if($value<32 && $value>=29) return "rgba(254, 1, 252, 1)";
if($value<29 && $value>=27) return "rgba(255, 9, 0, 1)";
if($value<27 && $value>=24) return "rgba(255, 170, 0, 1)";
if($value<24 && $value>=21) return "rgba(254, 245, 6, 1)";
if($value<21) return "rgba(0, 255, 0, 1)";
}
 */
var rampThom = [];
rampThom.push( { 'min':-99, 'max': 21, 'R':   0, 'G': 255, 'B':   0, 'color': 'black' } );
rampThom.push( { 'min': 21, 'max': 24, 'R': 254, 'G': 245, 'B':   6, 'color': 'black' } );
rampThom.push( { 'min': 24, 'max': 27, 'R': 255, 'G': 170, 'B':   0, 'color': 'black' } );
rampThom.push( { 'min': 27, 'max': 29, 'R': 255, 'G':   9, 'B':   0, 'color': 'black' } );
rampThom.push( { 'min': 29, 'max': 32, 'R': 254, 'G':   1, 'B': 252, 'color': 'black' } );
rampThom.push( { 'min': 32, 'max': 99, 'R': 128, 'G':  14, 'B': 180, 'color': 'black' } );

/**
if($parametro=="windchill") {
if($value>10)   return "rgba(0, 255, 0, 1)";
if($value>5)    return "rgba(0, 255, 170, 1)";
if($value>0)    return "rgba(0, 255, 255, 1)";
if($value>-5)   return "rgba(0, 221, 255, 1)";
if($value>-10)  return "rgba(0, 170, 255, 1)";
if($value>-15)  return "rgba(0, 153, 255, 1)";
if($value>-20)  return "rgba(0, 136, 255, 1)";
if($value<=-20) return "rgba(0, 119, 255, 1)";
}
*/
var rampWindchill = [];
rampWindchill.push( { 'min': -99, 'max': -20, 'R':   0, 'G': 119, 'B': 255, 'color': 'black' } );
rampWindchill.push( { 'min': -20, 'max': -15, 'R':   0, 'G': 136, 'B': 255, 'color': 'black' } );
rampWindchill.push( { 'min': -15, 'max': -10, 'R':   0, 'G': 153, 'B': 255, 'color': 'black' } );
rampWindchill.push( { 'min': -10, 'max':  -5, 'R':   0, 'G': 170, 'B': 255, 'color': 'black' } );
rampWindchill.push( { 'min':  -5, 'max':   0, 'R':   0, 'G': 221, 'B': 255, 'color': 'black' } );
rampWindchill.push( { 'min':   0, 'max':   5, 'R':   0, 'G': 255, 'B': 255, 'color': 'black' } );
rampWindchill.push( { 'min':   5, 'max':  10, 'R':   0, 'G': 255, 'B': 170, 'color': 'black' } );
rampWindchill.push( { 'min':  10, 'max':  99, 'R':   0, 'G': 255, 'B':   0, 'color': 'black' } );



// nome del layer aggiunto nella mappa
const layerMappa = 'STZ_INDICICLIMA';

// oggetto mappa
var map;

// oggetto popup sul punto stazione
var popup;

// oggetto kml
var kmlProvince;

// momento di aggiornamento del sensore intabellato
var aggiornamento;

//------------------------------------------------------------------------------
// variabili per la parte grafici
// stazione dei dati visualizzati
var nomeStazione;
var linkJsonDati;


/*------------------------------------------------------------------------------
    ritorna vero se la pagina è visualizzata su dispositivo mobile
*/
function isMobile() {

    /* Storing user's device details in a variable*/
    let details = navigator.userAgent;
        
    /* Creating a regular expression
    containing some mobile devices keywords
    to search it in details string*/
    let regexp = /android|iphone|kindle|ipad/i;

    /* Using test() method to search regexp in details
    it returns boolean value*/
    let isMobileDevice = regexp.test(details);


    return isMobileDevice;
}

/*------------------------------------------------------------------------------
*/
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\[").replace(/[\]]/, "\]");
    var regex = new RegExp("[\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

//-------------------------------------------------------------------------
// funzione di log su console se DEBUG
function myConsoleLog(sFrase) {
    if (DEBUG) { console.log(sFrase); }
}

//-------------------------------------------------------------------------
// ritorna vero se numero
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


/**
 * ritorna la data con aggiunta di n minuti
 */
Date.prototype.addMinutes = function(n) {
    this.setTime(this.getTime() + (n*60*1000));
    return this;
}

/*
 * ritorna la data con aggiunta di h ore
 */
Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}
/**
 * ritorna la data con aggiunta di giorni
 */
Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + days);
    return this;
}


/**
 * ritorna una data (2022-09-12T01:00:00) in UTC 
 * in realtà , visto che tutte le date sono in solare, faccio finta che il solare
 * corrisponda all'UTC in modo da non avere la conversione in locale del browser
 */
Date.prototype.ConvIstante = function( ist, isUTC = false ) {
    var nSolare = 0;
    if (isUTC) {nSolare = 1;}
    // 2022-09-12T01:00:00
    // 0123456789012345678
    var cosa = new Date(Date.UTC(ist.substring(0, 4), parseFloat(ist.substring(5, 7))-1, ist.substring(8, 10), parseFloat(ist.substring(11,13))+nSolare, ist.substring(14,16), 0, 0) );
    this.setTime( cosa.getTime() );
    return this;
}
/**
 * ritorna una data (30/04/2023 02:00) in UTC 
 * in realtà , visto che tutte le date sono in solare, faccio finta che il solare
 * corrisponda all'UTC in modo da non avere la conversione in locale del browser
 */
Date.prototype.ConvDataOra = function( ist, isUTC = false ) {
    var nSolare = 0;
    if (isUTC) {nSolare = 1;}
    // 30/04/2023 02:00
    // 0123456789012345
    var cosa = new Date(Date.UTC(ist.substring(6, 10), parseFloat(ist.substring(3, 5))-1, ist.substring(0, 2), parseFloat(ist.substring(11,13))+nSolare, ist.substring(14,16), 0, 0) );
    this.setTime( cosa.getTime() );
    return this;
}


/*------------------------------------------------------------------------------
  ritorna una stringa con la data nel formato indicato
*/
Date.prototype.Formato = function( formato ) {

    var mm = ('0' + (this.getUTCMonth()+1) ) .slice(-2);
    var dd = ('0' + this.getUTCDate()).slice(-2);
    var yyyy = this.getUTCFullYear();
    var hh = ('0' + (this.getUTCHours())).slice(-2);
    var mi = ('0' + this.getUTCMinutes()).slice(-2);
    var ss = ('0' + this.getUTCSeconds()).slice(-2);
    var mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno','Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']; 
    var giorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']; 
    
    var sRet = '';
    switch (formato) {
        case 'gg g mmm YYYY':
            sRet =giorni[ this.getUTCDay() ] + ' ' +  this.getUTCDate() + ' ' + mesi[ this.getUTCMonth() ] + ' ' + yyyy;
            break;
        case 'DD/MM/YYYY':
            sRet = dd + '/' + mm + '/' + yyyy;
            break;
        case 'DD/MM/YYYY HH':
            sRet = dd + '/' + mm + '/' + yyyy + ' ' + hh;
            break;
        case 'DD/MM/YYYY HH:mm':
            sRet = dd + '/' + mm + '/' + yyyy + ' ' + hh + ':' + mi;
            break;
        case 'DD HH'          :
            sRet = dd + ' ' + hh;
            break;
        case 'DD'          :
            sRet = dd;
            break;
        case 'HH:mm':
            sRet = hh + ':' + mi;
            break;
        case 'HH':
            sRet = hh;
            break;
        case 'mm':
            sRet = mi;
            break;
        case 'YYYYMMDD':
            sRet = yyyy + mm + dd;
            break;
        case 'YYYYMMDDHHmm':
            sRet = yyyy + mm + dd + hh + mi;
            break;
        case 'YYYYMMDDHH':
            sRet = yyyy + mm + dd + hh;
            break;
        case 'YYYY-MM-DDTHH-mm':
            sRet = yyyy + '-' + mm + '-' + dd + 'T' + hh + ':' + mi + ':00';
            break;
        default:
            sRet = this.toString();
            break;
    }
  
    return sRet;
}      

/**
 * ritorna la dimensione per il pallino sui grafici
 */
function RadiusGrafici() {
    return ( isMobile() ? MobilePointWidth : DeskPointWidth );
 }
 /**
  * ritorna la width per le linee sui grafici
  */
 function WidthGrafici() {
     return ( isMobile() ? MobileLineWidth : DeskLineWidth );
 }
 

/**
 * Ritorno PADOVA come Padova 
 */
function titleCase(string){
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
  }


/**
 * div sulla pagina con la mappa
 */
function CreaDivMappa() {

    var frase = '\
        <div id="Mappa-Tabella"> \
            <div class="row"> \
                <div class="col-12"> \
                    <div id="orarioRifer"></div> \
                    <div id="pulsantiOrario"></div> \
                </div> \
            </div> \
            <div class="row"> \
                <div class="col-12"> \
                    <div id="mappa" style="width: 100%; height: 800px; border: thin solid #A5A5A5"></div> \
                </div> \
            </div> \
            <div class="row container-fluid"> \
                <div class="col-12"> \
                    <div id="aggiornamento"></div> \
                    <div id="scalaColori" class="col-lg-12"></div> \
                    <br> \
                    <div id="tabellaStazioni"></div> \
                </div> \
            </div> \
            <style> \
                .prevent-select { \
                -webkit-user-select: none; /* Safari */ \
                -ms-user-select: none; /* IE 10 and IE 11 */ \
                user-select: none; /* Standard syntax */ \
                } \
            </style> \
        </div><br>';

    const divPage = document.createElement('div');
    divPage.setAttribute('id', 'divPage');
    // elimino lo spazio vuoto
    // filippo 02/09/2025 tolto divPage.style.marginTop = "-48px";

    divPage.innerHTML = frase;
    block.append(divPage);

    // aggiungo gli stili che uso 
    CreaStyle('Mappa-Tabella');

    // se si desiderano i pulsanti di cambio orario
    if (btnOrari) {
        orari.forEach(element => {
            const bt = document.createElement('btn');
            bt.setAttribute('id', 'btn' + element.targa );
            bt.setAttribute('class', 'btn btn-outline-primary btn-sm p-2')
            bt.setAttribute('style', 'background: white; padding: 6px 6px;')
            bt.innerHTML = element.pulsante;
            bt.onclick = function () { 
                CambiaOrario(element.passo); 
            }
            document.getElementById('pulsantiOrario').append(bt);
    
        });

    }

    // bottoni dei sensori 
    var frase = '<div id="bottoni" class="btn-group d-flex flex-wrap" role="group">';
    // per tutti i bottoni previsti
    // pulsanti['TEMP'] = { pulsante: 'Temperatura aria', coordcd: 18, targa: 'TEMP', unitaMis: '°C'};
    Object.entries(pulsanti).forEach(entry => {
        const [key, element] = entry;  
        let um = '';
        if (element.unitaMis) {
            um = '<br>(' + element.unitaMis + ')';
        } 
        const bt = '<button id="btn' + element.targa + '" class="btn btn-outline-primary btn-sm text-wrap">' + element.pulsante + um + '</button>';
        frase += bt;
    });
    frase += '</div>';
    const divBottoni = document.createElement('div');
    divBottoni.setAttribute('id', 'divBottoni');
    divBottoni.innerHTML = frase + '<div class="w-100"></div>';

    // metto i pulsanti dentro al div della mappa
    divBottoni.setAttribute('class', 'col-11 ol-overlaycontainer layer-button-control text-left btn-toolbar');
    divBottoni.setAttribute('role', 'toolbar');
    divBottoni.setAttribute('style', 'position: absolute; left: 80px; pointer-events: auto; z-index: 4000;')
    document.getElementById('mappa').append(divBottoni);

    // evento click su ogni bottone in modo da fare vedere i punti delle stazioni con il sensore voluto
    Object.entries(pulsanti).forEach(entry => {
        const [key, element] = entry;    
        const bt = document.getElementById('btn' + element.targa );
        bt.setAttribute('style', 'background: white; padding: 5px 5px;')
        // bt.setAttribute('class', 'col-sm');
        bt.onclick = function () { 
            AggiungiLivello(element); 
        }
    });

    // mappa geografica
    CaricaMappa('mappa');

}

/**
 * cambio l'orario di riferimento
 */
function CambiaOrario(passo) {

    if (passo == 0) { 
        currentOrario = 0; 
    } else {
        currentOrario += passo; 
    }
    if (currentOrario > 0 ) { currentOrario = 0; }
    if (currentOrario < -24 ) { currentOrario = 0; }

    // aggiorno la mappa;
    AggiungiLivello( currentBtn );

}

/**
 * create map
 */
function CaricaMappa(divMappa) {

    // spazio dove mettere il testo del popup sulla stazione
    const divHint = document.createElement('div');
    divHint.setAttribute('id', 'hintStazione');
    divHint.setAttribute('class', 'ol-overlay-container ol-selectable');
    divHint.style.transform= 'translate(-50%, -105%)';
    divHint.style.borderStyle = "solid";    
    divHint.style.borderWidth  = "thin";
    divHint.style.borderRadius = "5px";
    divHint.style.whiteSpace = 'nowrap';
    divHint.style.backgroundColor = "#636363";      
    divHint.style.borderColor = "#C4C4C4";
    divHint.style.padding = "5px";
    divHint.style.color = "white";
    divHint.style.fontFamily = '"Titillium Web",Geneva,Tahoma,sans-serif';
    divHint.style.fontSize = '10px';
    block.append(divHint);

    const MAP_DEFAULT_EXTENT = [818354.918, 5425389.1889, 1816693.282, 6070039.437];
    map = new ARPAVAPI.openlayers.ol.Map({
        target: divMappa,
        view: new ARPAVAPI.openlayers.ol.View({
            center: ARPAVAPI.openlayers.proj.transform([11.9, 45.8], 'EPSG:4326', 'EPSG:3857'),
            zoom: 8.5,
            maxZoom: 13,
            extent: MAP_DEFAULT_EXTENT,
        }),
        controls: [
            new ARPAVAPI.openlayers.control.Zoom()
        ]
    });
    
    // aggiungo lo sfondo 
    map.addLayer( getTileLayer() );
    
    // add kml delle province
    addKmlProvince();

    // popup sulla stazione    
	popup = new ARPAVAPI.openlayers.Overlay({
	  element: document.getElementById('hintStazione'),
      stopEvent: false,
	  autoPan: {
		animation: {
		  duration: 250,
		},
      },  
      
	});    
    map.addOverlay(popup)

    // click sul punto
    map.on('singleclick', function (evt) {
         clickMap(evt);
    }); 

    // change mouse cursor when over marker
    map.on('pointermove', function (evt) {
        mouseMoveOnMap(evt);
    });


}


/**
 * Get tile layer
 */
function getTileLayer() {
    return new ARPAVAPI.openlayers.layer.Tile({
        source: new ARPAVAPI.openlayers.source.OSM({
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        }),
        name: 'sfondo',
    });
}


/**
 * gestione del click sul punto della stazione 
 */
function clickMap(evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
        return feature;
    });
    if ( ! feature) {
        return;
    }
    
    const stz = feature.getProperties().data;
    if (stz) { 
        vediDati( feature.getProperties().data );
    }
}

/**
 * change mouse cursor when over marker 
 */
function mouseMoveOnMap(evt) {

    if (evt.dragging) return;

    var pixel = evt.map.getEventPixel(evt.originalEvent);
    var hit = map.hasFeatureAtPixel(evt.pixel, {
        layerFilter: function(layer) {
            return (layer.get('name') === layerMappa);
        }
    });   
    if (hit) {
        evt.map.getTargetElement().style.cursor = 'pointer';

        const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
            return feature;
        });
        if (feature) {
            const stz = feature.getProperties().data;
            if (stz) {
            
                const frase = stz.nome_stazione + ' (' + stz.quota + ' m s.l.m.)' + '<br>' +
                stz.indice + ': ' + (stz.valore === null ? 'assente' : stz.valore) + ' ' + currentBtn.unitaMis;
                document.getElementById('hintStazione').innerHTML = frase;
                
           		popup.setPosition(evt.coordinate);

            }
        } else {
            evt.map.getTargetElement().style.cursor = '';
            popup.setPosition(null);

        }   
        
    } else {
        evt.map.getTargetElement().style.cursor = '';
        popup.setPosition(null);
    }
        
    
}


/**
 * livello kml delle Province
 */
function addKmlProvince() {
    kmlProvince = new ARPAVAPI.openlayers.layer.Vector({
        source: new ARPAVAPI.openlayers.source.Vector({
          url: 'https://www.arpa.veneto.it/api/risorse/data-meteo/kml/Province.kml',
          format: new ARPAVAPI.openlayers.format.KML()
        }),
        name: 'kmlProvince',
    });
    
    map.addLayer( kmlProvince );    
    
}


/**
 * carico il livello indicato
 */
function AggiungiLivello(btn) {

    // cambio del colore sul pulsante premuto
    if (currentBtn) {
        document.getElementById( 'btn' + currentBtn.targa ).classList.remove('bg-primary');
        document.getElementById( 'btn' + currentBtn.targa ).classList.remove('text-white');
    }    
    currentBtn = btn;
    document.getElementById( 'btn' + currentBtn.targa ).classList.add('bg-primary');
    document.getElementById( 'btn' + currentBtn.targa ).classList.add('text-white');

    // se sono sull'orario corrente ma i minuti sono sotto ai MINUTI_CAMBIO_ORA0 allora orario precedente
    const adesso = new Date();
    if ( (currentOrario == 0 ) && ( adesso.getMinutes() < MINUTI_CAMBIO_ORA0) ){
        currentOrario = -1;
    }

    // visualizzo le stazioni del sensore indicato
    addStazioni();

}  

/**
 * cancello i layer delle stazioni e delle iso
 */    
function cancellaLayer() {
    map.getLayers().forEach(layer => {
        if ( layer && layer.get('name') ) {
            if ( layer.get('name') == layerMappa) {
                map.removeLayer(layer);
            }
        }
    });
}


/**
 * Aggiorno il div orarioRifer
 */
function AggiornaOrarioRifer( dataRifer, dataAggio ) {


    const lblOrario = document.getElementById('orarioRifer');
    lblOrario.innerHTML = '';

    const titolo = document.createElement('p');
    titolo.setAttribute('id', 'titoloOrarioRifer');
    titolo.setAttribute('class', 'h4');

    // per la brillanza non c'è orario di riferimento
    const titoletto = currentBtn.pulsante + 
        ( currentBtn.unitaMis.length > 0 ? ' (' + currentBtn.unitaMis + ')' : '' ) + 
        ' alle ' + dataRifer.Formato('HH:mm') + 
        ' solari di ' + dataRifer.Formato('gg g mmm YYYY');
    titolo.innerHTML = titoletto;

    // se cambio di giorno allora lo sfondo è arancione
    const adesso = new Date();
    if ( dataRifer.getUTCDay() != adesso.getUTCDay() ) {
        titolo.classList.add('bg-warning');
    }
    lblOrario.appendChild(titolo);

    document.getElementById('aggiornamento').innerHTML = 'Elaborazione delle ' + dataAggio.Formato('HH:mm') + ' solari.';    

}

/**
 * ritorno il colore rgb in base alla rampa e valore
 */
function ScalaColori(valore) {

    var rampa;
    switch (currentBtn.targa) {
        case 'humidex':
            rampa = rampHumidex;
            break;

        case 'windchill':
            rampa = rampWindchill;
            break;

        case 'thom':
            rampa = rampThom;
            break;

        case 'scharlau':
            rampa = rampScharlau;
            break;

        default:
            break;
    }

    var colore = 'rgb(0,0,0)'; // pallino nero se fuori scala
    rampa.forEach(function(classe) {
        if ( (valore >= classe.min) && (valore < classe.max) ) {
            colore = 'rgb(' + classe.R + ',' + classe.G + ',' + classe.B + ')';
        } 
    });
    return colore;
}

/**
 * ritorno il pallino colorato da valore; se valore == colorFill allora niente rampa colori
 */
function PallinoStazione(valore) {
    var colore = colorFill;


    // se valore assente allora grigio
    if ( valore === '' ) {
        colore = GRIGIO;
    } else {

        if (valore != colorFill) {
            // colore da rampa
            colore = ScalaColori(valore);
        }

    }

    var im = new ARPAVAPI.openlayers.style.Circle({
        radius: pointDimension,
        fill: new ARPAVAPI.openlayers.style.Fill({color: colore}),
        stroke: new ARPAVAPI.openlayers.style.Stroke({
          color: colorLine, 
          width: 1
        })
      });

    return im;
}

/**
 * ritorna la distanza fra due punti
 */
function distance(x1, y1, x2, y2) {
  return Math.sqrt( Math.pow(x2 - x1,2) + Math.pow(y2 - y1, 2 ));
}


/**
 * traduzione del file json negli array StazioniMappa
 */
function CaricaStazioniMappa(stzData) {

    // stazioni sulla mappa in base alla presenza dell'indice nel periodo
    StazioniMappa = [];

    // solo valori degli ultimi 2 giorni più il corrente
    DataOraInizio = new Date();
    DataOraInizio.setUTCDate(DataOraInizio.getUTCDate() - 2);
    DataOraInizio.setUTCHours( 0 );
    DataOraInizio.setUTCMinutes( 0 );
    DataOraInizio.setUTCSeconds( 0 );
    
    DataOraFine = new Date();
    DataOraFine.setUTCMinutes( 0 );
    DataOraFine.setUTCSeconds( 0 );

    // vado a rottura di codice su codseqst
    let oldStazione = {};
    let bStazioneValida = false;
    let ValoriStazio = [];
    stzData.forEach((stazione, index) => {  
        
        // primo ingresso
        if ( Object.keys(oldStazione).length == 0 ) {
            oldStazione = stazione;
            bStazioneValida = false;
        }

        // aggiungo la stazione quando si cambia codseqst
        if (oldStazione.codseqst != stazione.codseqst) {

            // solo se bStazioneValida
            if (bStazioneValida) {
                StazioniMappa.push(
                    { 
                        'codseqst': oldStazione.codseqst,
                        'point': oldStazione.point,
                        'codice_stazione': oldStazione.codice_stazione,
                        'nome_stazione': oldStazione.nome_stazione,
                        'provincia': oldStazione.provincia,
                        'quota': oldStazione.quota,
                        'indice': oldStazione.indice,
                        'dataora': ValoriStazio[ ValoriStazio.length-1 ].dataora,   // ultima dataora da visualizzare sulla mappa
                        'valore': ValoriStazio[ ValoriStazio.length-1 ].valore,     // ultimo valore da visualizzare sulla mappa
                        'aggiornamento': ValoriStazio[ ValoriStazio.length-1 ].aggiornamento,     // momento di aggiornamento del valore
                        'valori': ValoriStazio                                      // valori della stazione da intabellare
                    }
                );
            }
            oldStazione = stazione;
            bStazioneValida = false;
            ValoriStazio = [];
        }

        // per avere l'ultimo valore da visualizzare sulla mappa
        oldStazione = stazione;

        // valori da intabellare per la stazione in corso
        // solo se dataora > ieri a mezzanotte
        if ( stazione.dataora >= DataOraInizio.Formato('YYYY-MM-DDTHH-mm') ) {
            ValoriStazio.push( 
                {
                    'dataora': stazione.dataora,
                    'valore': stazione.valore,
                    'temp': stazione.temp,
                    'umid': stazione.umid,
                    'vvento': stazione.vvento,
                    'aggiornamento': stazione.aggiornamento
                }    
            );
        }

        // se trovo almeno un valore buono nella stazione allora pubblico la stazione e la sua tabella valori
        if (stazione.valore) {
            bStazioneValida = true;
        }

    });
    // ultima stazione --------------------
    if (bStazioneValida) {
        StazioniMappa.push(
            {
                'codseqst': oldStazione.codseqst,
                'point': oldStazione.point,
                'codice_stazione': oldStazione.codice_stazione,
                'nome_stazione': oldStazione.nome_stazione,
                'provincia': oldStazione.provincia,
                'quota': oldStazione.quota,
                'indice': oldStazione.indice,
                'dataora': ValoriStazio[ ValoriStazio.length-1 ].dataora,   // ultima dataora da visualizzare sulla mappa
                'valore': ValoriStazio[ ValoriStazio.length-1 ].valore,     // ultimo valore da visualizzare sulla mappa
                'aggiornamento': ValoriStazio[ ValoriStazio.length-1 ].aggiornamento,     // momento di aggiornamento del valore
                'valori': ValoriStazio                                      // valori della stazione da intabellare
            }
        );
    }

}    

/**
 * recupero le stazioni e le visualizzo
 */
async function addStazioni() {

    if (document.getElementById('titoloOrarioRifer')) {
        document.getElementById('titoloOrarioRifer').innerHTML = 'Recupero stazioni';
    }        
    document.getElementById('tabellaStazioni').innerHTML = '';
    document.getElementById('scalaColori').innerHTML = '';

    const lnk = lnkStazioni + currentBtn.targa + '&rnd=' + Math.random();  
    const response = await fetch(lnk);
    const jsonResponse = (await response.json());
    const stzData = jsonResponse.data;

    CaricaStazioniMappa(stzData);

    // oggetto geoJSON
    const geojsonObject = {
                type: 'FeatureCollection',
                crs: {
                    type: 'name',
                    properties: {
                        name: 'EPSG:3857',
                    },
                },
                features: [],
            };

    // carico le stazioni nel geoJSON e valorizzo le variabili per le informazioni
    let nomeSensore = '', um = '', dataAggio = 0, dataRifer = 0;

    let coord = [];

    StazioniMappa.forEach((stazione, index) => {  
        
        // cerco dove mettere l'etichetta sul punto se troppo vicini
        let posiz = 'bottom';
        coord.forEach(stzX => {
            if ( distance(stazione.longitudine, stazione.latitudine, stzX.longitudine, stzX.latitudine) < DISTANZA_STAZ ) {
                posiz = 'top';
            }
        });
        coord.push( { 'latitudine': stazione.latitudine, 'longitudine': stazione.longitudine} );

        geojsonObject.features.push({
            type: 'Feature',
            geometry: JSON.parse(stazione.point),
            properties: {
                id: stazione.codice_stazione,
                xTextBaseline: posiz,
                data: { ...stazione },              // tutte le proprietà della stazione presente nel json
            },
        });

        dataAggio = new Date().ConvIstante( stazione.aggiornamento );
        dataRifer = new Date().ConvIstante( stazione.dataora );

    });
   
    // punto della stazione di colore standard
    let iconStyle = new ARPAVAPI.openlayers.style.Style({
      image: PallinoStazione(colorFill),
    });

    // label stazione    
    var labelStyle = new ARPAVAPI.openlayers.style.Style({
        text: new ARPAVAPI.openlayers.style.Text({
            placement: 'point',
            font: fontStz,
            overflow: true,
            fill: new ARPAVAPI.openlayers.style.Fill({
                color: 'black',
            }),
            stroke: new ARPAVAPI.openlayers.style.Stroke({
                color: sfondoEtichetta,
                width: 4,
            }),
            offsetY: -3,
            textBaseline: 'bottom',
            textAlign: 'center', 
            rotation: 0,
            
        })
    });
    var style = [iconStyle, labelStyle];
    
    const vectorLayer = new ARPAVAPI.openlayers.layer.Vector({
        source: new ARPAVAPI.openlayers.source.Vector({
            format: new ARPAVAPI.openlayers.format.GeoJSON(),
            features: new ARPAVAPI.openlayers.format.GeoJSON({
                featureProjection: 'EPSG:3857',
            }).readFeatures(geojsonObject)
        }),
        visible: true,
        name: layerMappa,
        style: function(feature) {
            // valore da visualizzare in base al sensore
            let et = feature.getProperties().data.valore;
            if ( et ) {
                // tutto bene
            } else {
                // etichetta vuota in quanto l'ultimo valore non c'è ma ci sono i precedenti
                et = '';
            }  
            labelStyle.getText().setText( '' + et );

            // posizione dell'etichetta
            labelStyle.getText().setTextBaseline( feature.getProperties().xTextBaseline );

            // colore del pallino e dell'etichetta 'humidex', 'scharlau', 'thom', 'windchill'
            let xColo = PallinoStazione(et);
            iconStyle.setImage( xColo );

            return [iconStyle, labelStyle];
        },
    });
    
    // cancello i layer delle stazioni e delle iso
    cancellaLayer();

    // aggiungo il nuovo layer delle stazioni
    map.addLayer( vectorLayer );

    // orario di riferimento dei dati visualizzati
    AggiornaOrarioRifer( dataRifer, dataAggio );

    // tabella delle stazioni del sensore visualizzato
    TabellaStazioni();

    // scala dei colori usati per i pallini
    switch (currentBtn.targa) {
        case 'humidex':
            CaricaLegendaColori(currentBtn.pulsante, rampHumidex);
            break;
        case 'scharlau':
            CaricaLegendaColori(currentBtn.pulsante, rampScharlau);
            break;
        case 'thom':
            CaricaLegendaColori(currentBtn.pulsante, rampThom);
            break;
        case 'windchill':
            CaricaLegendaColori(currentBtn.pulsante, rampWindchill);
            break;
    }


}

/**
 * valorizza il div scalaColori con la rampa indicata
 */
function CaricaLegendaColori(etichetta, rampa) {

    const leg = document.getElementById('scalaColori');
    
    // se esiste già il pulsante allora lo elimino
    leg.innerHTML = '';

    // pulsante per vedere la rampa colori
    const bottone = document.createElement('button');
    bottone.setAttribute('id', 'btnLegenda');
    bottone.setAttribute('class', 'btn btn-outline-primary btn-sm');
    bottone.innerHTML = 'Legenda e descrizione ' + etichetta;
    bottone.onclick = function () {
        document.getElementById('legendaColori').classList.toggle("d-none");
    }
    // 02/09/2025 filippo tolto pulsante di legenda
    // leg.appendChild(bottone);

    // contenitore della legenda colori e della spiegazione
    const legSpiega = document.createElement('div');
    legSpiega.setAttribute('id', 'legendaColori');
    legSpiega.setAttribute('class', 'd-none row');
    leg.appendChild(legSpiega); 


    // contenitore rampa colori 
    const rampaDiv = document.createElement('div');
    // rampaDiv.setAttribute('id', 'legendaColori');
    rampaDiv.setAttribute('class', 'col-2 p-1');
    legSpiega.appendChild(rampaDiv);

    var precedente = -100;
    var fine = rampa.length;
    for (var i = 0; i < fine; i++) {
        var classe = rampa[i];
        const livello = document.createElement('div');
        livello.setAttribute('id', 'legenda-' + i);
        livello.setAttribute('class', 'border border-dark');
        livello.setAttribute('style', "color:" + classe.color + "; background-color:rgb(" +  classe.R + "," + classe.G + "," + classe.B + ");" );

        switch (i) {
            case 0:
                livello.innerHTML = etichetta + ' < ' + classe.max + ' ' + currentBtn.unitaMis;
                break;
            case fine-1:
                livello.innerHTML = etichetta + ' >= ' + classe.min + ' ' + currentBtn.unitaMis;
                break;
            default:
                livello.innerHTML = etichetta + ' >= ' + classe.min + ' e < ' + classe.max + ' ' + currentBtn.unitaMis;
                break;
        }
        rampaDiv.appendChild(livello);

    }  
    // testo di spiegazione dell'indice
    const spiega = document.createElement('div');
    spiega.setAttribute('id', 'spiegaIndice');
    spiega.setAttribute('class', 'col');
    spiega.innerHTML = spiegazioni[ currentBtn.targa ];
    legSpiega.appendChild(spiega);

}


/**
 * ritorna i gradi decimali in sessagesimali (gradi primi secondi)
 */
function CoordGradi( coord ) {

    const g = Math.floor(coord);
    const p = Math.floor( (coord - g ) * 60);
    const s = (coord - g - (p/60) ) * 60 * 60;
    const s2 = Math.round(s*1000)/1000;        // tre decimali arrotondati
    const ret = ' ' + g + '° ' + p + "' " + s2 + "'' "    

    myConsoleLog('CoordGradi ' + coord + ' ->' + ret );

    return ret;      
    
}

/**
 * Visualizzo la tabella delle stazioni 
 */
function TabellaStazioni() {

    document.getElementById('tabellaStazioni').innerHTML = '';

    // metto le stazioni in ordine alfabetico per provincia (sono già in ordine alfabetico basta dividerle per provincia)
    let ord = {'BELLUNO' : [], 'PADOVA' : [], 'ROVIGO' : [], 'TREVISO' : [], 'VENEZIA' : [], 'VICENZA' : [], 'VERONA' : [], 'UDINE' : []};

    StazioniMappa.forEach((stazione, index) => {            
        ord[ stazione.provincia ].push( stazione );
    });

    // tabella delle stazioni
    var table = document.createElement('table');
    table.setAttribute('id', 'eleStazioni');
    table.setAttribute('class', 'table table-sm table-striped table-bordered table-hover table-condensed');

    // div che contiene la tabella: per scrollarla
    var divTab = document.createElement('div');
    divTab.setAttribute('id', 'tabElencoStazioni');
    divTab.setAttribute('class', 'bmodal-body');
    divTab.style.height = "800px";    
    divTab.style.overflowY = "scroll";    
    divTab.append(table);
    // metto il div con la tabella nella pagina
    document.getElementById('tabellaStazioni').append(divTab);

    // contenuto della tabella
    var body = table.createTBody();
    var rowProv, cellProv;

    // ciclo le province
    Object.keys(ord).forEach( nomeProv => {       

        // metto la provincia solo se ci sono stazioni
        if ( ord[nomeProv].length == 0 ) {
            return; // equivalente a continue; questo fa andare alla prossima provincia 
        }

        // separatore di provincia
        rowProv = body.insertRow(-1);
        cellProv = rowProv.insertCell(-1);
        cellProv.colSpan = '25';   // giorno ; 24 colonne delle ore
        cellProv.innerHTML = 'Stazioni nella provincia di ' + titleCase(nomeProv);
        cellProv.style.textAlign = "left";
        cellProv.style.backgroundColor = '#bbbbbbff'; // btnBackgroundColor;
        cellProv.style.fontWeight = 'bold';
        cellProv.style.position = "sticky";
        cellProv.style.top = "-1px";

        // ciclo le stazioni della provincia
        for (let index = 0; index < ord[nomeProv].length; index++) {
            const e1 = ord[nomeProv][index];

            rowProv = body.insertRow(-1);
            cellProv = rowProv.insertCell(-1);
            cellProv.id = 'staz_' + e1.codseqst;
            cellProv.innerHTML = e1.nome_stazione;
            cellProv.colSpan = '25';   // giorno ; 24 colonne delle ore
            cellProv.style.textAlign = "left";
            cellProv.style.backgroundColor = btnBackgroundColor;

            rowProv = body.insertRow(-1);
            cellProv = rowProv.insertCell(-1);
            cellProv.innerHTML = 'Orario solare';
            cellProv.style.textAlign = "center";
            // 24 colonne
            for (let orario = 0; orario < 24; orario++) {
                cellProv = rowProv.insertCell(-1);
                cellProv.innerHTML = String(orario).padStart(2, '0');
                cellProv.style.textAlign = "center";
            }

            // produco le righe dei giorni (3) e le colonne delle ore (24)
            StazioneGiorniOre(body, e1);

            // valorizzo le celle della stazione
            e1.valori.forEach(element => {

                const giornoOra = new Date().ConvIstante(element.dataora);
                let id = e1.codseqst + '_' + giornoOra.Formato('YYYYMMDDHH');

                var cellX = document.getElementById(id);
                cellX.innerHTML = '&nbsp;';
                let v = 'assente';
                if (element.valore) {
                    v = element.valore + currentBtn.unitaMis;
                } 
                cellX.title = e1.nome_stazione + ' ' + giornoOra.Formato('DD/MM/YYYY HH') + ' (solari) ' + currentBtn.pulsante + ' ' + v ;
                // se valore assente allora grigio
                if (element.valore === null) {
                    cellX.style.backgroundColor = GRIGIO;
                } else {
                    cellX.style.backgroundColor = ScalaColori(element.valore);
                }

            });
            
        }
    });

}

/**
 * produco la tabella vuota dei giorni/ore della stazione
 */
function StazioneGiorniOre(body, e1) {

    // righe dei giorni dal più recente
    // for (let giorno = new Date(DataOraFine); giorno >= DataOraInizio; giorno.addDays(-1) ) {
    for (let giorno = new Date(DataOraInizio); giorno <= DataOraFine; giorno.addDays(1) ) {

        // colonna della data del giorno
        var row = body.insertRow(-1);
        var cell1 = row.insertCell(-1);
        cell1.innerHTML = giorno.Formato('DD/MM/YYYY');
        cell1.style.textAlign = "center";

        // 24 colonne degli orari
        for (let orario = 0; orario < 24; orario++) {
            cell1 = row.insertCell(-1);
            cell1.id = e1.codseqst + '_' + giorno.Formato('YYYYMMDD') + String(orario).padStart(2, '0');
            cell1.innerHTML = '&nbsp;';
            cell1.classList.add('prevent-select');
            cell1.style.textAlign = "center";
        }

    }


}


/**
 * mi posiziono sulla riga della tabella della stazione
 */
function vediDati( tuplaStaz ) {

    const idRowTabella = 'staz_' + tuplaStaz.codseqst;

    const tabEle = document.getElementById("tabElencoStazioni");
    const stazio = document.getElementById(idRowTabella);
    stazio.scrollIntoView( { behavior: "smooth", block: "center", inline: "nearest" } );
    tabEle.scrollTo({top:  stazio.offsetTop - 30, behavior: "smooth" } );

    // document.getElementById(idRowTabella).scrollIntoView( { behavior: "smooth", block: "center", inline: "nearest" } );
    // porto.focus( { focusVisible: true } );    

}

//-------------------------------------------------------------------------
// creazione della tabella dati
function createHTMLForTab(type, label, firstParameter) {
    // create tab item
    myConsoleLog('createHTMLForTab type ' + type + ' firstParameter ' + firstParameter);
    
    // create tab content
    const div = document.createElement('div');
    div.setAttribute('id', 'tabcontent-' + type);
    div.setAttribute('class', 'modal-body' );

    div.innerHTML = '<div id="nome-' + type + '"></div><canvas id="chart-' + type + '"></canvas>';
    document.getElementById('meteoTabPanelContent').append(div);

}

function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}

function formatDate(date) {
    return padTo2Digits(date.getDate()) + '-' + padTo2Digits(date.getHours());
}

/**
 * 
 */
function CreaStyle(dove) {

    let css = '.piccolo { \
        padding: 6px 6px; \
        font-size: 14px; \
        line-height: 1.45; \
        }';


    let head = document.head || document.getElementsByTagName('head')[0];
    

    let style = document.createElement('style');

//    document.getElementById( dove ).appendChild(style);
    head.appendChild(style);


    if (style.styleSheet){
        // This is required for IE8 and below.
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }
   
}

/**
 *
 */
function AddStyle(quanti) {
    var css = '.table-condensed {'+
              'font-size: ' + quanti + 'px;'+
              '}';
    let head = document.head || document.getElementsByTagName('head')[0];
    let style = document.createElement('style');
    head.appendChild(style);

    if (style.styleSheet){
        // This is required for IE8 and below.
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }
}

/**
 * Generates HTML
 */
function generateHTML() {

    // visualizzo la mappe delle stazioni
    CreaDivMappa();
    // parto dal primo pulsante presente
    let primoPulsante = Object.values(pulsanti)[0].targa;

    // lo nascondo
    document.getElementById( 'btn' + primoPulsante ).style.display = 'none';

    document.getElementById( 'btn' + primoPulsante ).click();

}


generateHTML();