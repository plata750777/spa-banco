// ⚠️ ATENCIÓN: Se eliminan los 'import' ya que el HTML usa script tags.

// =======================================================
// 1. CONFIGURACIÓN DE FIREBASE
// =======================================================

// 🔴 REEMPLAZA ESTOS VALORES CON TUS CREDENCIALES REALES DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCyo33C1UoXD5_PBQEdCEiOYxgwOpf9bKg",
  authDomain: "america-trust-capital.firebaseapp.com",
  projectId: "america-trust-capital",
  storageBucket: "america-trust-capital.firebasestorage.app",
  messagingSenderId: "1045232889549",
  appId: "1:1045232889549:web:1cb562cb5dd72340300384"
};

// Inicialización de Firebase (funciona gracias a los script tags en index.html)
const app = firebase.initializeApp(firebaseConfig)
const db = app.firestore()
const auth = app.auth()

// =======================================================
// 2. FUNCIÓN DE LOGIN
// =======================================================

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault() // Evita que el formulario recargue la página

  // ⚠️ Nota: El campo de 'username' en realidad es el Email para Firebase Auth
  const email = document.getElementById("loginUsername").value
  const password = document.getElementById("loginPassword").value

  try {
    // 🟢 LÓGICA DE AUTENTICACIÓN ACTIVA
    const userCredential = await auth.signInWithEmailAndPassword(email, password)
    const user = userCredential.user;
    
    console.log('Usuario autenticado con éxito:', user.email);

    // 🟢 LÓGICA DE REDIRECCIÓN (Ejemplo básico de Admin vs. Usuario estándar)
    // ⚠️ REEMPLAZA 'admin@tu-dominio.com' por el email real de tu administrador
    if (user.email === 'contrataciones.latam.aero@gmail.com') { 
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'main.html';
    }

  } catch (error) {
    console.error("Error al iniciar sesión:", error.code, error.message);
    
    let errorMessage = "Error al iniciar sesión. Verifica tus credenciales.";
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Email o contraseña incorrectos.";
    } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Formato de email inválido.";
    }
    alert(errorMessage);
  }
})

// =======================================================
// 3. REGISTRO Y GESTIÓN DE ESTADO (opcional)
// =======================================================

// Register Button Handler
document.getElementById("registerBtn").addEventListener("click", () => {
  console.log("Navegando a registro")
  // window.location.href = 'register.html';
})

// Revisa si el usuario ya está autenticado (para redirección automática)
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("Usuario ya autenticado:", user.email)
    // Redirige automáticamente si ya está logueado y está en index.html
    if (window.location.pathname.endsWith('index.html')) {
        if (user.email === 'contrataciones.latam.aero@gmail.com') { // ⚠️ REEMPLAZA ESTE EMAIL
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'main.html';
        }
    }
  } else {
    console.log("No hay usuario autenticado")
  }
})