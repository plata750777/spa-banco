// login_admin.js

import { createClient } from '@supabase/supabase-js'

// 1. Conexión con Supabase
const supabase = createClient(
  'https://dufhqzqyhjronnrzaira.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZmhxenF5aGpyb25ucnphaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjY5ODYsImV4cCI6MjA3NzAwMjk4Nn0.q1rfdDkg2_5I0o_kpBIxKF1V2bpJlcJKDG54-zqu158'
)


// 2. Referencias al DOM
const form = document.getElementById('adminLoginForm')
const emailInput = document.getElementById('adminEmail')
const passwordInput = document.getElementById('adminPassword')
const errorMsg = document.getElementById('adminLoginError')

// 3. Evento de login
form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = emailInput.value.trim()
  const password = passwordInput.value.trim()

  if (!email || !password) {
    errorMsg.textContent = 'Completa todos los campos'
    return
  }

  try {
    // Autenticación con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error || !data.user) {
      errorMsg.textContent = 'Correo o contraseña incorrectos'
      return
    }

    // Verificar rol en tabla `users`
    const { data: perfil, error: perfilError } = await supabase
      .from('users')
      .select('nombre, rol')
      .eq('id', data.user.id)
      .single()

    if (perfilError || perfil?.rol !== 'admin') {
      errorMsg.textContent = 'No tienes permisos de administrador'
      await supabase.auth.signOut()
      return
    }

    // Guardar sesión y redirigir
    sessionStorage.setItem(
      'loggedInUser',
      JSON.stringify({ isAdmin: true, info: perfil })
    )
    window.location.href = 'admin.html'
  } catch (err) {
    console.error('Error al iniciar sesión:', err)
    errorMsg.textContent = 'Error inesperado al iniciar sesión'
  }
})
