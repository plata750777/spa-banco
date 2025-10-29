// Ruta: api/logout.js (Función Serverless de Node.js en Vercel)

import { createClient } from '@supabase/supabase-js';
import { serialize } from 'cookie'; // ⬅️ Necesario para invalidar la cookie

// 🛑 Obtener Claves Secretas de Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY; 
const SESSION_COOKIE_NAME = 'secure_session_token'; 

// 🛡️ Crea el cliente Supabase usando la CLAVE SECRETA (Service Role Key)
const supabase = createClient(supabaseUrl, supabaseSecretKey);

export default async function handler(req, res) {
    // 1. Solo acepta solicitudes POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Solo POST.' });
    }

    // 2. Notificar a Supabase (cierre de sesión del lado del servidor)
    try {
        // Intenta cerrar la sesión de Supabase, aunque el cliente ya no tiene el JWT.
        // Esto es una capa adicional si el servidor maneja más estados de sesión.
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) {
            console.warn('Advertencia: Error al cerrar sesión en Supabase:', signOutError.message);
            // No detenemos el flujo, ya que la invalidación de la cookie es más importante.
        }
    } catch (e) {
        console.error('Fallo en la comunicación con Supabase durante el logout.');
    }

    // 3. CRÍTICO: Invalidar la cookie segura
    // Esto fuerza al navegador a eliminar la cookie 'secure_session_token'.
    const invalidCookie = serialize(SESSION_COOKIE_NAME, '', {
        httpOnly: true,         // Debe coincidir con la cookie original
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: -1,             // ⬅️ CRÍTICO: Configura la edad máxima en -1 (expira inmediatamente)
        path: '/',
    });
    
    // Adjuntar la cookie expirada a la respuesta
    res.setHeader('Set-Cookie', invalidCookie);

    // 4. Respuesta Exitosa
    // El frontend solo necesita un 200 OK para saber que la sesión fue terminada.
    return res.status(200).json({ 
        success: true, 
        message: 'Sesión terminada y token invalidado.' 
    });
}