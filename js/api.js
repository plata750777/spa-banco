// Función para enviar una solicitud de token al backend
async function sendTokenRequest(email) {
    try {
        const response = await fetch('/send-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        return await response.json();
    } catch (error) {
        console.error('Error al enviar el token:', error);
        return { success: false, message: 'Error de conexión' };
    }
}

// Función para verificar el token con el backend
async function verifyTokenRequest(token) {
    try {
        const response = await fetch('/verify-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });
        return await response.json();
    } catch (error) {
        console.error('Error al verificar el token:', error);
        return { success: false, message: 'Error de conexión' };
    }
}