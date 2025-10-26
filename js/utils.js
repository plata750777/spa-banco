function setLoggedInUser(user) {
    sessionStorage.setItem('loggedInUser', JSON.stringify(user));
}

// Función para obtener el usuario logueado de sessionStorage
function getLoggedInUser() {
    const user = sessionStorage.getItem('loggedInUser');
    return user ? JSON.parse(user) : null;
}

// Función para limpiar sessionStorage
function clearSession() {
    sessionStorage.clear();
    // También puedes limpiar localStorage si guardabas algo ahí que ya no necesitas
    // localStorage.clear();
}

// Las siguientes funciones ya NO son necesarias porque el backend gestiona los usuarios:
// function getUsers() { ... }
// function setUsers(users) { ... }
// function initializeUsers() { ... }
// let simulatedToken = { ... };
// async function sendTokenRequest(email) { ... }
// async function verifyTokenRequest(token) { ... }
