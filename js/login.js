// El script ya NO tiene la clave API de Supabase, lo que neutraliza el riesgo de exposición.
// La lógica de roles de administrador y las redirecciones condicionales han sido eliminadas.

// ✅ Referencias al DOM
const formLogin = document.getElementById('loginForm');
const inputEmail = document.getElementById('email');
const inputPassword = document.getElementById('password');
const mensajeError = document.getElementById('mensaje-error');

<<<<<<< HEAD
// ✅ Evento de login (envía a un endpoint seguro del servidor)
=======
// 2. Referencias al DOM
const formLogin = document.getElementById('loginForm') // ✅ correcto
const inputEmail = document.getElementById('email')
const inputPassword = document.getElementById('password')
const mensajeError = document.getElementById('mensaje-error')

// 3. Evento de login
>>>>>>> 6939196 (Actualización: migración completa a Supabase y limpieza de Firebase)
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = inputEmail.value.trim();
    const password = inputPassword.value.trim();
    
    // Desactivar el botón para prevenir envíos múltiples
    const loginButton = formLogin.querySelector('.login-button');
    loginButton.disabled = true;

    if (!email || !password) {
        mensajeError.textContent = 'Completa todos los campos';
        loginButton.disabled = false;
        return;
    }

    try {
        // 🔐 Petición Segura: Envía credenciales al servidor (backend)
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            // El servidor respondió con un error (401, 500, etc.)
            mensajeError.textContent = result.error || 'Credenciales incorrectas.';
            mensajeError.classList.add('error-text');
            return;
        }

        // 🚀 Éxito: El servidor blindado devolvió la confirmación
        // El servidor ya estableció la cookie HTTP-Only para la sesión.
        
        // 🔄 Redirección Única y Genérica (Ruta de acceso principal)
        // Redirige siempre a la página genérica para evitar exponer rutas sensibles.
        window.location.href = 'dashboard.html'; 

    } catch (error) {
        // Error de red o conexión
        mensajeError.textContent = 'Error de conexión con el sistema. Intente más tarde.';
        mensajeError.classList.add('error-text');
    } finally {
        loginButton.disabled = false;
    }
});