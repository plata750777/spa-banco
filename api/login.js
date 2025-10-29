// Ruta: api/login.js (Función Serverless para Vercel)
// ---------------------------------------------------------------------
// FUNCIÓN: Procesa credenciales, autentica con Supabase y establece una
// cookie de sesión segura (HttpOnly).
// ---------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';
import { serialize } from 'cookie'; 

// 🛑 CLAVES SECRETAS: Leídas desde las Variables de Entorno de Vercel.
// Se utilizan los nombres estandarizados:
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

// Nombre de la cookie de sesión para el navegador
const SESSION_COOKIE_NAME = 'secure_session_token'; 

// 🛡️ Crea el cliente Supabase usando la CLAVE SECRETA (Service Role Key)
// Esto otorga la autoridad necesaria para establecer la sesión.
const supabase = createClient(supabaseUrl, supabaseSecretKey);

export default async function handler(req, res) {
    // 1. Verificar el método (solo POST)
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido.' });
    }

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Credenciales incompletas.' });
    }

    // 2. Autenticación con Supabase
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
        });

        if (authError || !authData?.user) {
            // Falla de autenticación: Respuesta de error genérica (seguridad)
            console.error('Login failed:', authError?.message);
            return res.status(401).json({ error: 'Credenciales de acceso no válidas.' });
        }

        const user = authData.user;

        // 3. CRÍTICO: Establecer la Sesión Segura (Cookie HttpOnly)
        // Usamos el ID de usuario como token de sesión.
        const sessionToken = user.id;

        // Serializar la cookie con flags de seguridad
        const cookie = serialize(SESSION_COOKIE_NAME, sessionToken, {
            httpOnly: true,                         // 🛡️ IMPIDE ACCESO DESDE JAVASCRIPT DEL CLIENTE
            secure: process.env.NODE_ENV === 'production', // Solo si es HTTPS
            sameSite: 'strict',                     // 🛡️ Previene CSRF
            maxAge: 60 * 60 * 24,                   // 24 horas de duración de la sesión
            path: '/', 
        });
        
        // Adjuntar la cookie segura a la respuesta
        res.setHeader('Set-Cookie', cookie);

        // 4. Respuesta Exitosa
        // El frontend (login.js) recibirá un 200 OK y será redirigido a 'dashboard.html'.
        // Nota: La consulta para obtener el 'rol' fue eliminada para optimizar el rendimiento.
        return res.status(200).json({ 
            success: true, 
            message: 'Acceso exitoso. Cookie de sesión establecida.',
        });

    } catch (error) {
        console.error('Error de autenticación interna:', error);
        return res.status(500).json({ error: 'Error interno del servidor de autenticación.' });
    }
}