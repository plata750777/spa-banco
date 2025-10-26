document.addEventListener('DOMContentLoaded', function() {
    // !IMPORTANT: Reemplaza con la URL de tu backend desplegado en Vercel
    const BASE_API_URL = 'https://cryptobroker-pi.vercel.app/'; // <--- ¡Asegúrate de que esta sea la URL actual!

    const loginForm = document.getElementById('loginForm');
    const loginUsernameInput = document.getElementById('loginUsername');
    const loginPasswordInput = document.getElementById('loginPassword');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value.trim();

            try {
                const response = await fetch(`${BASE_API_URL}/api/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    sessionStorage.setItem('authToken', data.token);
                    sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));

                    if (data.user.isAdmin) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'main.html';
                    }

                } else {
                    alert(data.message || 'Error en el inicio de sesión.');
                    console.error('Error de login:', data);
                }
            } catch (error) {
                console.error('Error de red al iniciar sesión:', error);
                alert('No se pudo conectar con el servidor. Asegúrate de que el backend esté corriendo.');
            }
        });
    } else {
        console.error("Elemento loginForm no encontrado.");
    }
});
