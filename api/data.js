// Ruta: api/data.js (Función Serverless de Node.js en Vercel)

import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie'; // ⬅️ Necesario para leer la cookie

// 🛑 Obtener Claves Secretas de Vercel (Variables de Entorno)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY; 
const SESSION_COOKIE_NAME = 'secure_session_token'; // Debe coincidir con /api/login.js

// 🛡️ Crea el cliente Supabase usando la CLAVE SECRETA (Service Role Key)
const supabase = createClient(supabaseUrl, supabaseSecretKey);

export default async function handler(req, res) {
    // 1. Verificar el método de la solicitud
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Método no permitido. Solo GET.' });
    }

    // 2. CRÍTICO: Obtener el ID de usuario de la COOKIE SEGURA
    const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
    const secureUserId = cookies[SESSION_COOKIE_NAME]; // Leer la cookie HttpOnly

    // Si no hay ID seguro en la cookie, la sesión es inválida
    if (!secureUserId) {
        // El frontend recibirá 401 y el main.js ejecutará un logout y redirección
        return res.status(401).json({ error: 'Sesión no activa o expirada. Reautenticación requerida.' });
    }

    // 3. Cargar datos del perfil del cliente usando la CLAVE SECRETA
    try {
        const { data: perfil, error: perfilError } = await supabase
            .from('users')
            .select('*')
            .eq('id', secureUserId)
            .single();

        if (perfilError || !perfil) {
            console.error('Error al obtener perfil:', perfilError?.message || 'Perfil no encontrado');
            // La sesión es válida, pero el perfil no existe
            return res.status(404).json({ error: 'Datos de cliente no encontrados.' });
        }
        
        // 4. Respuesta Exitosa
        // Envía todos los datos del perfil necesarios para que main.js renderice la interfaz.
        return res.status(200).json({
            success: true,
            info: perfil,
            // Incluir un objeto 'user' genérico para compatibilidad con el frontend
            user: { id: secureUserId } 
        });

    } catch (error) {
        console.error('Error interno al consultar Supabase:', error);
        return res.status(500).json({ error: 'Error interno del sistema de capitales.' });
    }
}