// Ruta: middleware.js (LA VERSIÓN FINAL Y MÁS ESTABLE)

// 🛡️ 1. DEFINICIÓN DE CONFIGURACIÓN
export const config = {
    matcher: ['/((?!_next|api|favicon.ico|img|css|js).*)'],
    runtime: 'edge', 
};

// ✅ 2. IMPORTACIÓN COMPATIBLE
import { NextResponse } from '@vercel/next/server';

// 🧠 3. CONFIGURACIÓN DE DETECCIÓN (FUERA DEL MIDDLEWARE)
const BOT_PATTERNS = {
    // ... (Mantener las constantes afuera para eficiencia) ...
    'googlebot': 5, 'apis-google': 5, 'bingbot': 4, 'censysinspect': 5,
    'ahrefsbot': 4, 'semrushbot': 4, 'dotbot': 4, 'yandexbot': 3,
    'petalbot': 3, 'masscan': 6, 'nmap': 6,
    'python-requests': 6, 'curl': 6, 'wget': 6, 'go-http-client': 6,
    'okhttp': 5, 'java': 5, 'zgrab': 6, 'nessus': 6,
    'facebookexternalhit': 3, 'twitterbot': 3, 'slackbot': 3, 'monitor': 3,
};

const HIGH_RISK_COUNTRIES = ['US', 'CA', 'GB', 'DE', 'NL', 'RU', 'CN', 'FR', 'IE', 'SE', 'SG'];
const SUSPICIOUS_PATHS = ['/admin', '/config', '/setup'];
const BLOCK_THRESHOLD = 6;
const HONEYPOT_URL = '/img/promo-local.png';

export default function middleware(request) {
    const url = request.nextUrl.clone(); // Usar request.nextUrl.clone() es la forma correcta de Vercel
    const userAgent = request.headers.get('user-agent') || '';
    const lowerUA = userAgent.toLowerCase();
    const country = request.headers.get('x-vercel-ip-country') || 'UNKNOWN';
    const ip = request.headers.get('x-forwarded-for') || '';

    let riskScore = 0;

    // --- Lógica de Puntuación (Mantenida) ---
    for (const [pattern, score] of Object.entries(BOT_PATTERNS)) {
        if (lowerUA.includes(pattern)) {
            riskScore += score;
            if (score >= 6) riskScore = 10;
            break;
        }
    }
    if (HIGH_RISK_COUNTRIES.includes(country)) riskScore += 5;
    if (ip.startsWith('10.') || ip.startsWith('192.168') || ip === '') riskScore += 5;
    if (!request.headers.get('accept')) riskScore += 4;
    if (SUSPICIOUS_PATHS.includes(url.pathname)) riskScore += 6;

    const uaParts = lowerUA.split('/');
    if (uaParts.length > 3 || (lowerUA.includes('mozilla') && lowerUA.includes('curl'))) {
        riskScore += 4;
    }


    // 🧨 Bloqueo silencioso (CLOAKING)
    if (riskScore >= BLOCK_THRESHOLD) {
        console.log(`[ALERTA HACKER] Bloqueo silencioso: Score ${riskScore}, IP ${ip}, País ${country}, UA: ${userAgent.substring(0, 50)}...`);
        
        // 🛑 ENGALO SILENCIOSO: REWRITE es la única opción.
        url.pathname = HONEYPOT_URL;
        const response = NextResponse.rewrite(url);
        
        response.headers.set('x-risk-flag', 'true'); // Auditoría
        return response;
    }

    // 🔁 Reescritura de rutas limpias
    if (url.pathname === '/') {
        url.pathname = '/index.html';
        return NextResponse.rewrite(url);
    }

    if (url.pathname.startsWith('/dashboard')) {
        url.pathname = '/dashboard.html';
        return NextResponse.rewrite(url);
    }

    // ✅ Acceso normal
    return NextResponse.next();
}