// ✅ Conexión con Supabase
const supabase = window.supabase.createClient(
  'https://dufhqzqyhjronnrzaira.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZmhxenF5aGpyb25ucnphaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjY5ODYsImV4cCI6MjA3NzAwMjk4Nn0.q1rfdDkg2_5I0o_kpBIxKF1V2bpJlcJKDG54-zqu158'
);

// ✅ Referencias al DOM
const formLogin = document.getElementById('loginForm');
const inputEmail = document.getElementById('email');
const inputPassword = document.getElementById('password');
const mensajeError = document.getElementById('mensaje-error');

// ✅ Evento de login
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = inputEmail.value.trim();
  const password = inputPassword.value.trim();

  if (!email || !password) {
    mensajeError.textContent = 'Completa todos los campos';
    mensajeError.classList.add('error-text');
    return;
  }

  // 🔐 Autenticación
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError || !authData?.user) {
    mensajeError.textContent = 'Credenciales incorrectas';
    mensajeError.classList.add('error-text');
    return;
  }

  // 📋 Obtener perfil desde tabla 'users'
  const { data: perfil, error: perfilError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (perfilError || !perfil) {
    mensajeError.textContent = 'No se pudo cargar el perfil';
    mensajeError.classList.add('error-text');
    return;
  }

  // 💾 Guardar sesión completa
  sessionStorage.setItem('loggedInUser', JSON.stringify({
    user: authData.user,
    info: perfil,
    isAdmin: perfil.rol === 'admin'
  }));

  // 🚀 Redirección según rol
  window.location.href = perfil.rol === 'admin' ? 'admin.html' : 'main.html';
});
