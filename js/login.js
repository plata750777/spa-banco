// login.js

// 1. Conexión con Supabase
const supabase = window.supabase.createClient(
  'https://dufhqzqyhjronnrzaira.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZmhxenF5aGpyb25ucnphaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjY5ODYsImV4cCI6MjA3NzAwMjk4Nn0.q1rfdDkg2_5I0o_kpBIxKF1V2bpJlcJKDG54-zqu158'
)

// 2. Referencias al DOM
const formLogin = document.getElementById('loginForm') // ✅ correcto
const inputEmail = document.getElementById('email')
const inputPassword = document.getElementById('password')
const mensajeError = document.getElementById('mensaje-error')

// 3. Evento de login
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = inputEmail.value.trim()
  const password = inputPassword.value.trim()

  // Validación visual
  if (!email || !password) {
    mensajeError.textContent = 'Completa todos los campos'
    mensajeError.classList.add('error-text')
    return
  }

  // 4. Autenticación con Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError || !authData?.user) {
    mensajeError.textContent = 'Credenciales incorrectas'
    mensajeError.classList.add('error-text')
    return
  }

  // 5. Obtener perfil del usuario
  const { data: perfil, error: perfilError } = await supabase
    .from('users')
    .select('nombre, rol')
    .eq('id', authData.user.id)
    .single()

  if (perfilError || !perfil) {
    mensajeError.textContent = 'No se pudo cargar el perfil'
    mensajeError.classList.add('error-text')
    return
  }

  // 6. Guardar sesión
  sessionStorage.setItem(
    'loggedInUser',
    JSON.stringify({ info: perfil, isAdmin: perfil.rol === 'admin' })
  )

  // 7. Redirección según rol
  if (perfil.rol === 'admin') {
    window.location.href = 'admin.html'
  } else {
    window.location.href = 'main.html'
  }
})
