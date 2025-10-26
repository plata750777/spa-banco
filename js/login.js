// login.js

// 1. Conexión con Supabase
const supabase = supabase.createClient(
  'https://dufhqzqyhjronnrzaira.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZmhxenF5aGpyb25ucnphaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjY5ODYsImV4cCI6MjA3NzAwMjk4Nn0.q1rfdDkg2_5I0o_kpBIxKF1V2bpJlcJKDG54-zqu158'
)

// login.js

import { createClient } from '@supabase/supabase-js'

// 1. Conexión con Supabase
const supabase = createClient(
  'https://TU_PROYECTO.supabase.co',
  'TU_API_KEY_PUBLICA'
)

// 2. Referencias al DOM
const formLogin = document.getElementById('form-login')
const inputEmail = document.getElementById('email')
const inputPassword = document.getElementById('password')
const mensajeError = document.getElementById('mensaje-error')

// 3. Evento de login
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault()

  const email = inputEmail.value.trim()
  const password = inputPassword.value.trim()

  if (!email || !password) {
    mensajeError.textContent = 'Completa todos los campos'
    return
  }

  try {
    // Autenticación con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error || !data.user) {
      mensajeError.textContent = 'Correo o contraseña incorrectos'
      return
    }

    // Obtener perfil del usuario
    const { data: perfil, error: perfilError } = await supabase
      .from('users')
      .select('nombre, rol')
      .eq('id', data.user.id)
      .single()

    if (perfilError || !perfil) {
      mensajeError.textContent = 'No se pudo cargar el perfil'
      return
    }

    // Guardar sesión
    sessionStorage.setItem(
      'loggedInUser',
      JSON.stringify({ info: perfil, isAdmin: perfil.rol === 'admin' })
    )

    // Redirección según rol
    if (perfil.rol === 'admin') {
      window.location.href = 'admin.html'
    } else {
      window.location.href = 'main.html'
    }
  } catch (err) {
    console.error('Error inesperado:', err)
    mensajeError.textContent = 'Error inesperado al iniciar sesión'
  }
})
