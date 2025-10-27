// ✅ Conexión con Supabase
const supabase = window.supabase.createClient(
  'https://dufhqzqyhjronnrzaira.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZmhxenF5aGpyb25ucnphaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjY5ODYsImV4cCI6MjA3NzAwMjk4Nn0.q1rfdDkg2_5I0o_kpBIxKF1V2bpJlcJKDG54-zqu158'
);

// ✅ Referencias al DOM
const formRegistro = document.getElementById('registroForm');
const inputNombre = document.getElementById('nombre');
const inputCorreo = document.getElementById('correo');
const inputCuenta = document.getElementById('cuenta');
const inputPassword = document.getElementById('password');
const mensajeError = document.getElementById('mensaje-error');

// ✅ Evento de registro
formRegistro.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = inputNombre.value.trim();
  const correo = inputCorreo.value.trim();
  const cuenta = inputCuenta.value.trim();
  const password = inputPassword.value.trim();

  if (!nombre || !correo || !cuenta || !password) {
    mensajeError.textContent = 'Completa todos los campos obligatorios';
    mensajeError.classList.add('error-text');
    return;
  }

  // 🔐 Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({ email: correo, password });
  if (authError || !authData?.user?.id) {
    mensajeError.textContent = 'Error al crear cuenta: ' + authError.message;
    mensajeError.classList.add('error-text');
    return;
  }

  // 📋 Insertar perfil en tabla 'users'
  const perfil = {
    id: authData.user.id,
    nombre,
    correo,
    cuenta,
    estado: 'activa',
    saldoAhorros: 0,
    saldoCorriente: 0,
    saldoTarjeta: 0,
    consignaciones: 0,
    creditos: 0,
    pagos: 0,
    rol: 'cliente'
  };

  const { error: insertError } = await supabase.from('users').insert(perfil);
  if (insertError) {
    mensajeError.textContent = 'Error al guardar perfil: ' + insertError.message;
    mensajeError.classList.add('error-text');
    return;
  }

  // 💾 Guardar sesión y redirigir
  sessionStorage.setItem('loggedInUser', JSON.stringify({
    user: authData.user,
    info: perfil,
    isAdmin: false
  }));

  window.location.href = 'main.html';
});
