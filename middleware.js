// Ruta: middleware.js (Nivel Hacker Profesional)

import { NextResponse } from '@vercel/next/server';

// 1. 🛑 CONFIGURACIÓN DE DEFENSA
// Define los patrones de escaneo y bot con puntuaciones de riesgo

const BOT_PATTERNS = {
    // Escáneres de seguridad y bots de indexación (Alto riesgo)
    'googlebot': 5, 'apis-google': 5, 'bingbot': 4, 'censysinspect': 5, 
    'ahrefsbot': 4, 'semrushbot': 4, 'dotbot': 4, 'yandexbot': 3, 
    'petalbot': 3, 'masscan': 6, 'nmap': 6,

    // Herramientas de scripting y análisis (Riesgo muy alto)
    'python-requests': 6, 'curl': 6, 'wget': 6, 'go-http-client': 6, 
    'okhttp': 5, 'java': 5, 'zgrab': 6, 'nessus': 6,
    
    // Herramientas de redes sociales y monitoreo (Riesgo medio)
    'facebookexternalhit': 3, 'twitterbot': 3, 'slackbot': 3, 'monitor': 3,
};

// 2. 🌍 PAÍSES DE ALTO RIESGO
// Centros de datos de hosting/VPNs conocidos. Puntuación: 5
const HIGH_RISK_COUNTRIES = ['US', 'CA', 'GB', 'DE', 'NL', 'RU', 'CN', 'FR', 'IE', 'SE', 'SG'];

// 3. 🛡️ UMBRAL DE BLOQUEO
const BLOCK_THRESHOLD = 6; // Si el riesgo supera 6, se bloquea silenciosamente.

// 4. PÁGINA SEÑUELO (El archivo real que los bots verán)
const HONEYPOT_URL = '/img/promo-local.png'; // Usamos una imagen genérica o archivo señuelo.

export async function middleware(request) {
    const userAgent = request.headers.get('user-agent') || '';
    const lowerUA = userAgent.toLowerCase();
    const country = request.geo?.country || 'UNKNOWN';
    const url = request.nextUrl;
    
    let riskScore = 0;

    // --- CÁLCULO DE PUNTUACIÓN DE RIESGO ---

    // 1. Puntuación por User-Agent
    for (const [pattern, score] of Object.entries(BOT_PATTERNS)) {
        if (lowerUA.includes(pattern)) {
            riskScore += score;
            // Si el UA es un escáner obvio (masscan, nmap), la puntuación es crítica
            if (score >= 6) riskScore = 10; 
            break;
        }
    }

    // 2. Puntuación por País
    if (HIGH_RISK_COUNTRIES.includes(country)) {
        riskScore += 5;
    }
    
    // 3. Puntuación por Ausencia de Aceptación (Comportamiento robótico)
    // Los navegadores normales envían un 'Accept' header complejo. Los robots, a veces no.
    if (!request.headers.get('accept')) {
        riskScore += 4;
    }

    // --- LÓGICA DE BLOQUEO SILENCIOSO ---

    if (riskScore >= BLOCK_THRESHOLD) {
        // 🛑 BLOQUEO SILENCIOSO (SILENT CLOAKING)
        
        // 1. Auditoría opcional: Puedes registrar este evento en Vercel Logs.
        console.log(`[ALERTA HACKER] Bloqueo silencioso: Score ${riskScore}, País ${country}, UA: ${userAgent.substring(0, 50)}...`);

        // 2. Reescritura a un recurso inofensivo. 
        // El bot pensará que ha accedido a la página, pero solo verá el contenido de la imagen (o un HTML vacío).
        // Si tienes una página señuelo HTML convincente, úsala aquí.
        return NextResponse.rewrite(new URL(HONEYPOT_URL, request.url));
        
        // La redirección brusca a Google fue eliminada para evitar dejar rastro.
    }

    // --- REESCRITURAS DE RUTAS LEGÍTIMAS (Si el usuario es limpio) ---

    // La lógica de reescritura es vital para que las URLs limpias carguen los archivos.
    if (url.pathname === '/') {
        return NextResponse.rewrite(new URL('/index.html', request.url));
    }

    if (url.pathname.startsWith('/dashboard')) {
        return NextResponse.rewrite(new URL('/dashboard.html', request.url));
    }
    
    // Si la reescritura de /main.html es necesaria, puedes agregarla:
    // if (url.pathname.startsWith('/main')) {
    //     return NextResponse.rewrite(new URL('/main.html', request.url));
    // }

    // Acceso normal para usuarios legítimos
    return NextResponse.next();
}

// 5. CONFIGURACIÓN DEL MATCHER
export const config = {
    // Aplica el middleware a casi todo, excluyendo archivos estáticos esenciales y endpoints /api
    matcher: ['/((?!_next|api|favicon.ico|img|css|js).*)'],
};