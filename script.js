const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// ============================================================
// CONFIGURACIÓN
// ============================================================
const URL_AGENDA = 'https://tvlibreonline.tv/agenda/';
const URL_RUSTICOTV_AGENDA = 'https://rusticotv.la/agenda.php';
const AJUSTE_HORAS = 0;

// CONFIGURACIÓN DE GITHUB
// Poné acá tu token nuevo (revocá el viejo, quedó expuesto en el código anterior).
// Si preferís no tenerlo en el archivo, también podés setear GITHUB_TOKEN como variable de entorno.
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = 'tadeoallende/repos-web';
const GITHUB_PATH = 'datos.json';
const GITHUB_BRANCH = 'main';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`;

// ============================================================
// MAPEO DE CLASES CSS A COMPETENCIAS Y LOGOS
// ============================================================
const CLASE_COMPETENCIA = {
    'AR': { competencia: 'Liga Profesional Argentina', logo: 'https://angulismo-pics.pages.dev/saf.png' },
    'URU': { competencia: 'Primera División Uruguay', logo: 'https://bestleague.world/jr/56.png' },
    'CH': { competencia: 'Primera División Chile', logo: 'https://bestleague.world/jr/35.png' },
    'BRA': { competencia: 'Brasileirão', logo: 'https://angulismo-pics.pages.dev/br.png' },
    'PE': { competencia: 'Liga 1 (Perú)', logo: 'https://bestleague.world/jr/127.png' },
    'PY': { competencia: 'Copa de Primera (Paraguay)', logo: 'https://th.bing.com/th/id/R.e99f17f7e19ea90bd22eb61a342ae872?rik=3hRgXphiDwho4Q&pid=ImgRaw&r=0' },
    'COL': { competencia: 'Liga BetPlay', logo: 'https://angulismo-pics.pages.dev/col.png' },
    'LC': { competencia: 'Leagues Cup', logo: 'https://images.seeklogo.com/logo-png/26/2/mls-logo-png_seeklogo-264551.png' },
    'USA': { competencia: 'MLS', logo: 'https://images.seeklogo.com/logo-png/26/2/mls-logo-png_seeklogo-264551.png' },
    'FUT': { competencia: 'Fútbol Amistoso', logo: 'https://angulismo-pics.pages.dev/fut.png' },
    'ENG': { competencia: 'EFL Cup', logo: 'https://angulismo-pics.pages.dev/en.png' },
    'HOL': { competencia: 'Eredivisie', logo: 'https://angulismo-pics.pages.dev/fut.png' },
    'UFC': { competencia: 'UFC', logo: 'https://images.seeklogo.com/logo-png/27/1/ufc-logo-png_seeklogo-272931.png' },
    'ES': { competencia: 'LaLiga', logo: 'https://angulismo-pics.pages.dev/es.png' },
    'IT': { competencia: 'Serie A', logo: 'https://angulismo-pics.pages.dev/ital.png' },
    'ALE': { competencia: 'Bundesliga', logo: 'https://angulismo-pics.pages.dev/alem.png' },
    'FRA': { competencia: 'Ligue 1', logo: 'https://angulismo-pics.pages.dev/fr.png' },
    'POR': { competencia: 'Primeira Liga', logo: 'https://angulismo-pics.pages.dev/pt.png' },
    'MEX': { competencia: 'Liga MX', logo: 'https://angulismo-pics.pages.dev/mx.png' },
    'ECUA': { competencia: 'Serie A Ecuador', logo: 'https://angulismo-pics.pages.dev/ec.png' },
    'BOL': { competencia: 'Primera División Bolivia', logo: '' },
    'CR': { competencia: 'Primera División Costa Rica', logo: 'https://image.shutterstock.com/image-photo/image-260nw-2441660539.jpg' },
    'HON': { competencia: 'Liga Nacional', logo: '' },
    'NBA': { competencia: 'NBA', logo: 'https://angulismo-pics.pages.dev/nba.png' },
    'MLB': { competencia: 'MLB', logo: 'https://images.seeklogo.com/logo-png/25/1/mlb-logo-png_seeklogo-250501.png' },
    'NFL': { competencia: 'NFL Pretemporada', logo: 'https://images.seeklogo.com/logo-png/16/2/nfl-logo-png_seeklogo-168592.png' },
    'TE': { competencia: 'ATP WTA', logo: 'https://images.seeklogo.com/logo-png/24/1/tenis-logo-png_seeklogo-240691.png' },
    'MOTOGP': { competencia: 'MotoGP', logo: 'https://images.seeklogo.com/logo-png/9/1/motogp-logo-png_seeklogo-95111.png' },
    'CICLISMO': { competencia: 'Ciclismo', logo: 'https://www.letour.fr/themes/custom/letour/logo.png' },
    'BOX': { competencia: 'Boxeo', logo: 'https://angulismo-pics.pages.dev/box.png' },
    'CHA': { competencia: 'UEFA Champions League', logo: 'https://img.uefa.com/imgml/uefacom/ucl/2024/logos/logo_light.png' },
    'UE': { competencia: 'UEFA Europa League', logo: 'https://img.uefa.com/imgml/uefacom/uefaeuropaleague/2024/logos/logo_light.png' },
    'UEC': { competencia: 'UEFA Conference League', logo: 'https://img.uefa.com/imgml/uefacom/uefaeuropaconferenceleague/2024/logos/logo_light.png' },
    'WNBA': { competencia: 'WNBA', logo: 'https://www.wnba.com/assets/images/wnba-logo.png' },
    'SUD': { competencia: 'Copa Sudamericana', logo: 'https://images.onefootball.com/icons/leagueColoredCompetition/128/102.png' },
    'LIB': { competencia: 'Copa Libertadores', logo: 'https://bestleague.world/jr/76.png' },
    // Clases vistas en el CSS real de RusticoTV (agenda.php) que no estaban mapeadas:
    'LEAGUESCUP': { competencia: 'Leagues Cup', logo: 'https://images.seeklogo.com/logo-png/26/2/mls-logo-png_seeklogo-264551.png' },
    'CONCACAFCHA': { competencia: 'Copa Centroamericana de Concacaf', logo: 'https://angulismo-pics.pages.dev/fut.png' },
    'CHI': { competencia: 'Primera División Chile', logo: 'https://bestleague.world/jr/35.png' },
    'TENIS': { competencia: 'ATP WTA', logo: 'https://images.seeklogo.com/logo-png/24/1/tenis-logo-png_seeklogo-240691.png' },
    'F1': { competencia: 'Fórmula 1', logo: 'https://angulismo-pics.pages.dev/fut.png' },
    'TUR': { competencia: 'Süper Lig (Turquía)', logo: 'https://angulismo-pics.pages.dev/fut.png' },
    'BEL': { competencia: 'Jupiler Pro League (Bélgica)', logo: 'https://angulismo-pics.pages.dev/fut.png' },
    'ARA': { competencia: 'Liga Saudí', logo: 'https://angulismo-pics.pages.dev/fut.png' },
    'FIFA': { competencia: 'Mundial 2026', logo: 'https://angulismo-pics.pages.dev/fut.png' },
    'NAT': { competencia: 'Selecciones Nacionales', logo: 'https://angulismo-pics.pages.dev/fut.png' },
    'WWE': { competencia: 'WWE', logo: 'https://angulismo-pics.pages.dev/fut.png' },
    'default': { competencia: 'Eventos', logo: 'https://angulismo-pics.pages.dev/fut.png' }
};

// Palabras clave (en el TÍTULO del evento, no en clases CSS) para detectar competencia
// cuando la fuente no nos da una clase confiable (caso RusticoTV).
const PALABRA_CLAVE_COMPETENCIA = [
    { match: /champions league/i, key: 'CHA' },
    { match: /europa league/i, key: 'UE' },
    { match: /conference league/i, key: 'UEC' },
    { match: /libertadores/i, key: 'LIB' },
    { match: /sudamericana/i, key: 'SUD' },
    { match: /leagues cup/i, key: 'LC' },
    { match: /liga profesional/i, key: 'AR' },
    { match: /liga betplay|liga colombiana/i, key: 'COL' },
    { match: /liga mx/i, key: 'MEX' },
    { match: /concacaf/i, key: 'FUT' },
    { match: /\bmlb\b/i, key: 'MLB' },
    { match: /\bnba\b/i, key: 'NBA' },
    { match: /\bnfl\b/i, key: 'NFL' },
    { match: /tenis|atp|wta/i, key: 'TE' },
];

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function ajustarFecha(fechaStr) {
    if (!fechaStr) return fechaStr;
    try {
        const fecha = new Date(fechaStr);
        fecha.setHours(fecha.getHours() + AJUSTE_HORAS);
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        const hours = String(fecha.getHours()).padStart(2, '0');
        const minutes = String(fecha.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:00`;
    } catch (e) {
        return fechaStr;
    }
}

function limpiarTitulo(titulo, hora) {
    let limpio = titulo.replace(hora, '').trim();
    limpio = limpio.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    return limpio;
}

// Filtro de seguridad: descarta cualquier "evento" que en realidad sea
// basura de CSS/HTML colada por un selector demasiado amplio.
function pareceBasuraCSS(texto) {
    if (!texto) return true;
    if (/[{};]/.test(texto)) return true;              // llaves/punto y coma -> CSS
    if (/<\/?[a-z][\s\S]*>/i.test(texto)) return true;  // tags HTML sueltos
    if (/background-image|:before|:after/i.test(texto)) return true;
    return false;
}

function detectarCompetenciaPorClase(clases) {
    if (!clases) return CLASE_COMPETENCIA.default;
    const classList = clases.split(/\s+/);
    for (const cls of classList) {
        if (CLASE_COMPETENCIA[cls]) {
            return CLASE_COMPETENCIA[cls];
        }
    }
    return CLASE_COMPETENCIA.default;
}

// Detección de competencia a partir del TÍTULO del evento (para RusticoTV,
// que no nos da clases CSS confiables como TVLibre).
function detectarCompetenciaPorTitulo(titulo) {
    for (const regla of PALABRA_CLAVE_COMPETENCIA) {
        if (regla.match.test(titulo)) {
            return CLASE_COMPETENCIA[regla.key] || CLASE_COMPETENCIA.default;
        }
    }
    return CLASE_COMPETENCIA.default;
}

function limpiarOpciones(opciones) {
    const vistos = new Set();
    const opcionesUnicas = [];
    opciones.forEach(op => {
        const clave = op.iframe;
        if (!vistos.has(clave)) {
            vistos.add(clave);
            opcionesUnicas.push(op);
        }
    });
    return opcionesUnicas;
}

// El href de cada canal en RusticoTV es "/embed/eventos.html?r=BASE64", donde
// BASE64 es directamente la URL real del iframe (así arma el iframe.src el propio
// sitio en el navegador). No hace falta pegarle a esa página, alcanza con decodificar.
function decodificarIframeReal(href, baseUrl) {
    try {
        let urlAbsoluta = href;
        if (!urlAbsoluta.startsWith('http')) {
            urlAbsoluta = `${baseUrl}${urlAbsoluta.startsWith('/') ? '' : '/'}${urlAbsoluta}`;
        }
        const urlObj = new URL(urlAbsoluta);
        const rParam = urlObj.searchParams.get('r');
        if (rParam) {
            const decodificada = Buffer.from(rParam, 'base64').toString('utf-8');
            if (decodificada.startsWith('http')) return decodificada;
        }
        return urlAbsoluta; // fallback: si no se pudo decodificar, dejamos la url tal cual
    } catch (e) {
        console.warn(`      ⚠️ No se pudo decodificar el iframe real de: ${href}`);
        return href;
    }
}

// Normaliza un título de evento para poder comparar/unificar el mismo partido
// entre fuentes distintas, que lo escriben con pequeñas diferencias
// ("vs" vs "vs.", tildes, espacios, mayúsculas, etc.)
function normalizarTitulo(str) {
    return str
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // saca tildes
        .toLowerCase()
        .replace(/\bvs\.?\b/g, 'vs')
        .replace(/[.:|]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Combina dos listas de canales del mismo evento, evitando duplicar
// opciones que apunten al mismo iframe real.
function fusionarCanales(existentes, nuevos) {
    const map = new Map();
    for (const c of existentes) {
        map.set(c.name.toLowerCase().trim(), { name: c.name, options: [...c.options] });
    }
    for (const c of nuevos) {
        const clave = c.name.toLowerCase().trim();
        if (!map.has(clave)) {
            map.set(clave, { name: c.name, options: [...c.options] });
        } else {
            const existente = map.get(clave);
            for (const opt of c.options) {
                if (!existente.options.some(o => o.iframe === opt.iframe)) {
                    existente.options.push(opt);
                }
            }
        }
    }
    return Array.from(map.values());
}

// Cuando la fuente nos da un nombre de canal genérico o poco confiable
// ("Eventos" -que además coincide justo con nuestro propio default de
// competencia sin clasificar-, "Canal", vacío), tratamos de inferir el
// nombre real a partir del identificador de stream en la URL (ej:
// ?stream=disney5 -> "Disney+"). Así el mirror se agrupa con el canal
// correcto en vez de quedar como una entrada fantasma aparte.
const MAPA_SLUG_CANAL = {
    'disney': 'Disney+',
    'espn': 'ESPN', 'espnplus': 'ESPN+',
    'fox1ar': 'Fox Sports 1', 'foxsports': 'Fox Sports 1',
    'tntsports': 'TNT Sports',
    'dsports': 'DSports',
    'mls': 'MLS Season Pass',
    'fanatiz': 'Fanatiz',
    'sportv_1pt': 'Sport TV',
    'tycinternacional': 'TyC Internacional'
};

function inferirNombreCanalDesdeUrl(url) {
    try {
        let urlReal = url;
        const urlObj = new URL(url);
        const rParam = urlObj.searchParams.get('r');
        if (rParam) {
            const decodificada = Buffer.from(rParam, 'base64').toString('utf-8');
            if (decodificada.startsWith('http')) urlReal = decodificada;
        }
        const match = urlReal.match(/[?&](?:stream|channel|get)=([^&]+)/i);
        if (!match) return null;
        let slug = decodeURIComponent(match[1]).toLowerCase();
        slug = slug.replace(/(es|en|pt)$/i, '').replace(/\d+$/, ''); // saca sufijos de idioma/mirror (disney5 -> disney, mls2es -> mls)
        return MAPA_SLUG_CANAL[slug] || null;
    } catch (e) {
        return null;
    }
}

const NOMBRES_CANAL_SOSPECHOSOS = new Set(['eventos', 'canal', '']);

function normalizarNombreCanal(canal) {
    if (!NOMBRES_CANAL_SOSPECHOSOS.has(canal.name.toLowerCase().trim())) {
        return canal;
    }
    for (const opt of canal.options) {
        const inferido = inferirNombreCanalDesdeUrl(opt.iframe);
        if (inferido) return { name: inferido, options: canal.options };
    }
    return canal; // no se pudo inferir nada mejor, se deja como está
}

// Paso final antes de guardar un evento: a veces el mismo iframe real termina
// repetido en dos canales con nombre distinto (ej: "DSports" y "DSports
// (Recomendado)" apuntando al mismo link) porque vienen de fuentes distintas
// que lo nombraron distinto. Acá se corrigen nombres genéricos, se reagrupa
// por nombre, se deja solo la primera aparición de cada iframe en todo el
// evento, y se renumeran las opciones de cada canal para que no queden
// nombres repetidos dentro del mismo canal.
function finalizarCanales(canales) {
    const canalesRenombrados = canales.map(normalizarNombreCanal);
    const agrupados = fusionarCanales([], canalesRenombrados); // reagrupa por nombre corregido

    const iframesVistos = new Set();
    const resultado = [];

    for (const canal of agrupados) {
        const opcionesUnicas = [];
        for (const opt of canal.options) {
            if (iframesVistos.has(opt.iframe)) continue;
            iframesVistos.add(opt.iframe);
            opcionesUnicas.push(opt);
        }
        if (opcionesUnicas.length === 0) continue; // el canal quedó vacío tras el dedup

        const opcionesRenumeradas = opcionesUnicas.map((opt, idx) => {
            const sufijoMatch = opt.name.match(/\(([^)]+)\)\s*$/);
            const sufijo = sufijoMatch ? ` (${sufijoMatch[1]})` : '';
            return { name: `Opción ${idx + 1}${sufijo}`, iframe: opt.iframe };
        });

        resultado.push({ name: canal.name, options: opcionesRenumeradas });
    }

    return resultado;
}

// ============================================================
// EXTRAER IFRAMES DE UNA PÁGINA DE TRANSMISIÓN (TVLIBRE)
// ============================================================
async function extraerIframesDePaginaTVLibre(url) {
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml',
                'Referer': 'https://tvlibreonline.tv/'
            },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const opciones = [];
        const vistos = new Set();

        $('.server-links a, .actions-row a, .btn-md, a[onclick*="iframe.src"]').each((i, el) => {
            const $a = $(el);
            const onclick = $a.attr('onclick') || '';
            const href = $a.attr('href') || '';
            const texto = $a.text().trim() || `Opción ${i+1}`;

            let urlExtraida = '';
            if (onclick) {
                const match = onclick.match(/src\s*=\s*['"]([^'"]+)['"]/);
                if (match) urlExtraida = match[1];
            }
            if (!urlExtraida && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
                urlExtraida = href;
            }
            if (!urlExtraida || urlExtraida === '#' || urlExtraida === '') return;

            let urlCompleta = urlExtraida.trim();
            if (urlCompleta && !urlCompleta.startsWith('http')) {
                if (urlCompleta.startsWith('/')) {
                    urlCompleta = `https://tvlibreonline.tv${urlCompleta}`;
                } else {
                    urlCompleta = `https://tvlibreonline.tv/${urlCompleta}`;
                }
            }
            if (!urlCompleta || urlCompleta === 'https://tvlibreonline.tv/#' || urlCompleta === 'https://tvlibreonline.tv/') return;
            if (urlCompleta.includes('chatbro.com') || urlCompleta.includes('chat')) return;

            const clave = `${texto}-${urlCompleta}`;
            if (vistos.has(clave)) return;
            vistos.add(clave);
            opciones.push({ name: texto, iframe: urlCompleta });
        });

        if (opciones.length === 0) {
            $('iframe#iframe, .iframe-wrap iframe').each((i, el) => {
                const src = $(el).attr('src') || '';
                if (src && !vistos.has(src)) {
                    vistos.add(src);
                    let urlCompleta = src;
                    if (src && !src.startsWith('http')) {
                        urlCompleta = `https://tvlibreonline.tv${src}`;
                    }
                    opciones.push({ name: 'Opción 1', iframe: urlCompleta });
                }
            });
        }

        if (url.includes('/eventos/?r=')) {
            try {
                const urlObj = new URL(url);
                const rParam = urlObj.searchParams.get('r');
                if (rParam) {
                    const urlDecodificada = Buffer.from(rParam, 'base64').toString('utf-8');
                    if (urlDecodificada && !vistos.has(urlDecodificada)) {
                        vistos.add(urlDecodificada);
                        opciones.push({ name: `Opción ${opciones.length + 1}`, iframe: urlDecodificada });
                    }
                }
            } catch (e) {}
        }

        return limpiarOpciones(opciones);
    } catch (error) {
        console.error(`      ⚠️ Error al extraer ${url}:`, error.message);
        return [];
    }
}

// ============================================================
// EXTRAER AGENDA DE TVLIBRE
// ============================================================
async function extraerAgendaTVLibre() {
    console.log('📋 Extrayendo agenda de TVLibre...');
    try {
        const { data } = await axios.get(URL_AGENDA, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const eventos = [];

        $('.menu > li').each((index, elemento) => {
            const $li = $(elemento);
            const $link = $li.children('a').first();
            const clases = $li.attr('class') || '';
            const horaSpan = $link.find('.t').text().trim() || '00:00';
            const tituloCompleto = $link.text().trim();
            const titulo = limpiarTitulo(tituloCompleto, horaSpan);

            if (!titulo || titulo.length < 3) return;
            if (pareceBasuraCSS(titulo)) return; // filtro de seguridad (bug del evento #1)

            const infoCompetencia = detectarCompetenciaPorClase(clases);
            const urlsTransmision = [];

            $li.find('ul li a, a[href*="/en-vivo/"], a[href*="/eventos/"]').each((i, el) => {
                const $a = $(el);
                const url = $a.attr('href') || '';
                const texto = $a.text().trim();
                const calidad = $a.find('span').text().trim();
                const nombreCanal = texto.replace(calidad, '').trim() || 'Canal';

                if (!url || url === '#') return;
                if (texto === titulo) return;

                let urlCompleta = url;
                if (url && !url.startsWith('http')) {
                    urlCompleta = `https://tvlibreonline.tv${url}`;
                }

                if (urlCompleta && urlCompleta !== 'https://tvlibreonline.tv#' && urlCompleta !== 'https://tvlibreonline.tv/') {
                    urlsTransmision.push({
                        canal: nombreCanal,
                        url: urlCompleta,
                        calidad: calidad || 'Sin calidad'
                    });
                }
            });

            const hoy = new Date();
            const fechaStr = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')} ${horaSpan.padStart(5, '0')}:00`;
            const fechaAjustada = ajustarFecha(fechaStr);

            eventos.push({
                id: eventos.length + 1,
                evento: titulo,
                fecha: fechaAjustada,
                competencia: infoCompetencia.competencia,
                logoUrl: infoCompetencia.logo,
                urls: urlsTransmision,
                fuente: 'tvlibre'
            });
        });

        console.log(`   ✅ ${eventos.length} eventos encontrados en TVLibre`);
        return eventos;
    } catch (error) {
        console.error('   ❌ Error en TVLibre:', error.message);
        return [];
    }
}

// ============================================================
// EXTRAER AGENDA DE RUSTICOTV (REESCRITO - misma plantilla que TVLibre)
// ============================================================
// Confirmado con el HTML real de agenda.php: es EXACTAMENTE la misma
// plantilla que usa TVLibre -> <ul class="menu"><li class="CLASE">
//   <a href="#">Título<span class="t">HH:MM</span></a>
//   <ul><li class="subitem1"><a href="/embed/eventos.html?r=...">Canal<span>Calidad 720p</span></a></li>...</ul>
// </li>
// El bug anterior (split por línea + regex de texto) mezclaba HTML
// crudo en los nombres. Acá se recorre el DOM real con cheerio, igual
// que extraerAgendaTVLibre, y se usa directamente el href de cada
// canal (ya es la URL de embed funcional).
async function extraerAgendaRusticoTV() {
    console.log('📋 Extrayendo agenda de RusticoTV...');
    try {
        const { data } = await axios.get(URL_RUSTICOTV_AGENDA, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        const eventos = [];
        const hoy = new Date();
        const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth()+1).padStart(2,'0')}-${String(hoy.getDate()).padStart(2,'0')}`;

        $('.menu > li').each((index, elemento) => {
            const $li = $(elemento);
            const $link = $li.children('a').first();
            const clases = $li.attr('class') || '';
            const horaSpan = $link.find('.t').text().trim() || '00:00';
            const tituloCompleto = $link.text().trim();
            const titulo = limpiarTitulo(tituloCompleto, horaSpan);

            if (!titulo || titulo.length < 3) return;
            if (pareceBasuraCSS(titulo)) return;

            // Preferimos la clase CSS real (ej: "CHA", "LIB", "LEAGUESCUP");
            // si no matchea ninguna clase conocida, probamos por palabras clave del título.
            let infoCompetencia = detectarCompetenciaPorClase(clases);
            if (infoCompetencia === CLASE_COMPETENCIA.default) {
                infoCompetencia = detectarCompetenciaPorTitulo(titulo);
            }

            const canalesMap = new Map();

            $li.children('ul').find('li.subitem1 > a, li > a').each((i, el) => {
                const $a = $(el);
                const href = $a.attr('href') || '';
                if (!href || href === '#') return;

                const calidadTexto = $a.find('span').text().trim();
                const calMatch = calidadTexto.match(/Calidad\s*([\dA-Za-z]+p?)/i);
                const calidad = calMatch ? calMatch[1] : '';
                let nombre = $a.clone().children('span').remove().end().text().trim();
                const opMatch = nombre.match(/\|\s*OP\s*(\d+)/i);
                nombre = nombre.replace(/\|\s*OP\s*\d+/i, '').trim();
                if (!nombre) return;

                // Iframe real (decodificado del parámetro r), no la página /embed/eventos.html
                const urlCompleta = decodificarIframeReal(href, 'https://rusticotv.la');

                const claveCanal = nombre.toLowerCase();
                if (!canalesMap.has(claveCanal)) {
                    canalesMap.set(claveCanal, { name: nombre, options: [] });
                }
                const existe = canalesMap.get(claveCanal).options.some(o => o.iframe === urlCompleta);
                if (!existe) {
                    canalesMap.get(claveCanal).options.push({
                        name: `Opción ${opMatch ? opMatch[1] : '1'}${calidad ? ` (${calidad})` : ''}`,
                        iframe: urlCompleta
                    });
                }
            });

            const fechaStr = `${fechaHoy} ${horaSpan.padStart(5, '0')}:00`;
            const fechaAjustada = ajustarFecha(fechaStr);
            const canales = limpiarCanales(Array.from(canalesMap.values()));

            eventos.push({
                evento: titulo,
                fecha: fechaAjustada,
                competencia: infoCompetencia.competencia,
                logoUrl: infoCompetencia.logo,
                canales,
                fuente: 'rusticotv'
            });
        });

        console.log(`   ✅ ${eventos.length} eventos encontrados en RusticoTV`);
        return eventos;
    } catch (error) {
        console.error('   ❌ Error en RusticoTV:', error.message);
        return [];
    }
}

function limpiarCanales(canales) {
    return canales.map(c => ({
        name: c.name,
        options: limpiarOpciones(c.options)
    })).filter(c => c.options.length > 0);
}

// ============================================================
// PROCESAR EVENTOS - EXTRAER IFRAMES (solo hace falta para TVLibre;
// RusticoTV ya trae el iframe real desde el href)
// ============================================================
async function procesarEventos(eventos) {
    console.log('\n🔍 Extrayendo iframes de cada transmisión...');
    const eventosConIframes = [];

    for (let i = 0; i < eventos.length; i++) {
        const evento = eventos[i];
        console.log(`   [${i+1}/${eventos.length}] ${evento.evento.substring(0, 40)}...`);

        if (evento.fuente === 'rusticotv') {
            // Ya viene con canales/iframes armados desde extraerAgendaRusticoTV
            eventosConIframes.push({
                id: evento.id,
                evento: evento.evento,
                fecha: evento.fecha,
                competencia: evento.competencia,
                logoUrl: evento.logoUrl,
                canales: finalizarCanales(evento.canales || [])
            });
            continue;
        }

        // fuente === 'tvlibre'
        const canalesMap = new Map();

        if (!evento.urls || evento.urls.length === 0) {
            eventosConIframes.push({
                id: evento.id,
                evento: evento.evento,
                fecha: evento.fecha,
                competencia: evento.competencia,
                logoUrl: evento.logoUrl,
                canales: finalizarCanales(evento.canales || []) // preservar lo fusionado desde RusticoTV
            });
            continue;
        }

        for (const trans of evento.urls) {
            console.log(`      📺 ${trans.canal}: ${trans.url.substring(0, 50)}...`);
            const iframes = await extraerIframesDePaginaTVLibre(trans.url);

            if (iframes.length > 0) {
                const claveCanal = trans.canal.toLowerCase().trim();
                if (!canalesMap.has(claveCanal)) {
                    canalesMap.set(claveCanal, { name: trans.canal, options: [] });
                }
                const canal = canalesMap.get(claveCanal);
                iframes.forEach(iframe => {
                    const existe = canal.options.some(o => o.iframe === iframe.iframe);
                    if (!existe) {
                        canal.options.push({ name: iframe.name, iframe: iframe.iframe });
                    }
                });
                console.log(`      ✅ ${iframes.length} iframes encontrados`);
            } else {
                console.log(`      ⚠️ Sin iframes disponibles`);
            }
        }

        const canalesDesdeTVLibre = Array.from(canalesMap.values())
            .filter(c => c.options.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name));

        // Si el evento ya traía canales fusionados desde RusticoTV (misma
        // "clave" de título en fusionarEventos), los combinamos acá en vez
        // de descartarlos.
        const canales = finalizarCanales(fusionarCanales(evento.canales || [], canalesDesdeTVLibre));

        eventosConIframes.push({
            id: evento.id,
            evento: evento.evento,
            fecha: evento.fecha,
            competencia: evento.competencia,
            logoUrl: evento.logoUrl,
            canales: canales
        });
    }

    console.log(`\n   ✅ ${eventosConIframes.length} eventos procesados`);
    return eventosConIframes;
}

// ============================================================
// FUSIONAR EVENTOS DE AMBAS FUENTES
// ============================================================
function fusionarEventos(eventosTVLibre, eventosRustico) {
    console.log('\n🔀 Fusionando eventos de TVLibre y RusticoTV...');

    const eventosMap = new Map();

    // Agregar eventos de TVLibre (prioridad: si el mismo partido está en ambas
    // fuentes, nos quedamos con el título/hora de TVLibre y le sumamos los
    // canales de RusticoTV)
    for (const evento of eventosTVLibre) {
        const clave = normalizarTitulo(evento.evento);
        if (!eventosMap.has(clave)) {
            eventosMap.set(clave, { ...evento, canales: [...(evento.canales || [])] });
        }
    }

    // Agregar eventos de RusticoTV: si el título normalizado coincide con uno
    // ya existente (mismo partido, aunque esté escrito distinto o con otra
    // hora por huso horario del sitio), fusiona canales en vez de duplicar.
    for (const evento of eventosRustico) {
        const clave = normalizarTitulo(evento.evento);
        if (!eventosMap.has(clave)) {
            eventosMap.set(clave, { ...evento, canales: [...(evento.canales || [])] });
        } else {
            const existente = eventosMap.get(clave);
            existente.canales = fusionarCanales(existente.canales || [], evento.canales || []);
        }
    }

    const eventosFusionados = Array.from(eventosMap.values());
    eventosFusionados.sort((a, b) => {
        return new Date(a.fecha) - new Date(b.fecha);
    });
    eventosFusionados.forEach((e, i) => e.id = i + 1);

    console.log(`   ✅ Total: ${eventosFusionados.length} eventos (${eventosTVLibre.length} de TVLibre, ${eventosRustico.length} de RusticoTV)`);
    return eventosFusionados;
}

// ============================================================
// OBTENER DATOS ACTUALES DE GITHUB
// ============================================================
async function obtenerDatosActuales() {
    if (!GITHUB_TOKEN || GITHUB_TOKEN === 'PEGA_ACA_TU_TOKEN_NUEVO') {
        return { events: [], channels: [] }; // sin token configurado, no tiene sentido pegarle a la API
    }
    try {
        const response = await axios.get(GITHUB_API_URL, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (response.data.content) {
            const contenido = Buffer.from(response.data.content, 'base64').toString('utf-8');
            return JSON.parse(contenido);
        }
        return { events: [], channels: [] };
    } catch (error) {
        return { events: [], channels: [] };
    }
}

// ============================================================
// GUARDAR EN GITHUB
// ============================================================
async function guardarEnGitHub(eventos) {
    console.log('\n📤 Subiendo a GitHub...');

    try {
        let sha = null;
        try {
            const response = await axios.get(GITHUB_API_URL, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            sha = response.data.sha;
            console.log('   ✅ Archivo existente encontrado (SHA obtenido)');
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log('   ℹ️ Archivo no existe, se creará uno nuevo');
            } else {
                throw error;
            }
        }

        const dataActual = await obtenerDatosActuales();
        const nuevoJSON = {
            events: eventos,
            channels: dataActual.channels || []
        };

        const contenido = JSON.stringify(nuevoJSON, null, 2);
        const contenidoBase64 = Buffer.from(contenido).toString('base64');

        const payload = {
            message: `Actualización automática de eventos - ${new Date().toLocaleDateString()}`,
            content: contenidoBase64,
            branch: GITHUB_BRANCH
        };
        if (sha) payload.sha = sha;

        const response = await axios.put(GITHUB_API_URL, payload, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            }
        });

        console.log(`   ✅ Archivo actualizado en GitHub!`);
        console.log(`   🔗 https://github.com/${GITHUB_REPO}/blob/${GITHUB_BRANCH}/${GITHUB_PATH}`);
        return true;

    } catch (error) {
        console.error('   ❌ Error al subir a GitHub:', error.response?.data?.message || error.message);
        console.log('   💾 Guardando copia local como datos.json');
        const dataActual = await obtenerDatosActuales();
        const output = {
            events: eventos,
            channels: dataActual.channels || []
        };
        fs.writeFileSync('datos.json', JSON.stringify(output, null, 2), 'utf-8');
        return false;
    }
}

// ============================================================
// PRINCIPAL
// ============================================================
async function main() {
    console.log('🚀 SCRAPER TVLIBRE + RUSTICOTV - CON IFRAMES REALES Y LOGOS\n');
    console.log(`🕒 Ajuste horario: +${AJUSTE_HORAS} horas\n`);

    if (!GITHUB_TOKEN || GITHUB_TOKEN === 'PEGA_ACA_TU_TOKEN_NUEVO') {
        console.log('⚠️  No se configuró GITHUB_TOKEN. Guardando localmente...\n');
        const eventosTVLibre = await extraerAgendaTVLibre();
        const eventosRustico = await extraerAgendaRusticoTV();
        const eventosFusionados = fusionarEventos(eventosTVLibre, eventosRustico);

        if (eventosFusionados.length > 0) {
            const eventosProcesados = await procesarEventos(eventosFusionados);
            const dataActual = await obtenerDatosActuales();
            const output = {
                events: eventosProcesados,
                channels: dataActual.channels || []
            };
            fs.writeFileSync('datos.json', JSON.stringify(output, null, 2), 'utf-8');
            console.log(`💾 ${eventosProcesados.length} eventos guardados en datos.json`);
        }
        return;
    }

    const eventosTVLibre = await extraerAgendaTVLibre();
    const eventosRustico = await extraerAgendaRusticoTV();
    const eventosFusionados = fusionarEventos(eventosTVLibre, eventosRustico);

    if (eventosFusionados.length === 0) {
        console.log('❌ No se encontraron eventos');
        return;
    }

    const eventosProcesados = await procesarEventos(eventosFusionados);
    await guardarEnGitHub(eventosProcesados);

    console.log('\n✅ ¡Proceso completado!');
}

main();
