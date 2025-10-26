// Firebase ya está cargado desde los scripts en el HTML
const firebase = window.firebase // Declare the firebase variable

// ⚠️ Configuración de Firebase - Reemplaza con tu configuración real
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
}

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig)
const db = app.firestore()
const auth = app.auth()

// Variables globales
let user
let sessionTimeout
let dynamicKeyInterval
let timerRotationInterval

// Inicialización cuando el DOM está listo
document.addEventListener("DOMContentLoaded", () => {
  // Obtener usuario de sessionStorage
  user = JSON.parse(sessionStorage.getItem("loggedInUser"))

  if (!user || user.isAdmin) {
    // Si no hay usuario o es admin, redirigir al login
    window.location.href = "index.html"
    return
  }

  inicializarPagina()
})

// Función principal de inicialización
function inicializarPagina() {
  // Cargar datos del usuario
  cargarDatosUsuario()

  // Iniciar clave dinámica
  generateDynamicKey()
  dynamicKeyInterval = setInterval(generateDynamicKey, 30000)

  // Iniciar animación del temporizador
  simulateTimerCircle()

  // Configurar eventos
  configurarEventos()

  // Renderizar gráfico
  renderMovementsChart()

  // Iniciar control de sesión
  resetSessionTimeout()
}

// Cargar datos del usuario en la interfaz
function cargarDatosUsuario() {
  // Saludo personalizado
  document.getElementById("userGreeting").textContent = `Hola, ${user.info.nombre}`

  // Información de cuenta
  document.getElementById("accountNumber").textContent = `Número de Cuenta: ${user.info.cuenta}`
  document.getElementById("accountBalance").textContent = `Saldo disponible: ${formatCurrency(user.info.saldoAhorros)}`
  document.getElementById("accountType").textContent = `Tipo de Cuenta: ${user.info.tipoCuenta || "Ahorros"}`

  // Modal de detalles
  document.getElementById("modalAccountNumber").textContent = user.info.cuenta
  document.getElementById("modalAccountType").textContent = user.info.tipoCuenta || "Cuenta Ahorros"
  document.getElementById("modalOpeningDate").textContent = user.info.fechaApertura || "N/A"
  document.getElementById("modalInterestRate").textContent =
    user.info.tasaInteres !== undefined ? `${user.info.tasaInteres}% EA` : "1.5% EA"

  // Saldos en modal
  document.getElementById("savingsBalance").textContent = formatCurrency(user.info.saldoAhorros)
  document.getElementById("currentBalance").textContent = formatCurrency(user.info.saldoCorriente)
  document.getElementById("creditCardBalance").textContent = formatCurrency(user.info.saldoTarjeta)

  // Información adicional
  const additionalInfo = document.getElementById("additionalInfo")
  additionalInfo.innerHTML = `
        <h2>Información Personal</h2>
        <p><strong>Dirección:</strong> ${user.info.direccion || "N/A"}</p>
        <p><strong>Correo:</strong> ${user.info.correo || "N/A"}</p>
        <p><strong>Tiempo de residencia:</strong> ${user.info.residencia || "N/A"}</p>
        <p><strong>Estado civil:</strong> ${user.info.estadoCivil || "N/A"}</p>
        <p><strong>Personas a cargo:</strong> ${user.info.personasCargo || "N/A"}</p>
        <p><strong>Trabajo actual:</strong> ${user.info.trabajo || "N/A"}</p>
        <p><strong>Salario mensual:</strong> ${user.info.salario !== null ? formatCurrency(user.info.salario) : "N/A"}</p>
        <p><strong>Gastos mensuales:</strong> ${user.info.gastos !== null ? formatCurrency(user.info.gastos) : "N/A"}</p>
        <p><strong>Deudas:</strong> ${user.info.deudas !== null ? formatCurrency(user.info.deudas) : "N/A"}</p>
        <p><strong>Inversiones:</strong> ${user.info.inversiones !== null ? formatCurrency(user.info.inversiones) : "N/A"}</p>
    `
}

// Configurar event listeners
function configurarEventos() {
  // Botón de cerrar sesión
  document.getElementById("logoutBtn").addEventListener("click", logout)

  // Formulario de transferencia
  document.getElementById("transferForm").addEventListener("submit", processTransfer)

  // Cerrar modales al hacer clic fuera
  window.addEventListener("click", (event) => {
    const modals = document.getElementsByClassName("modal")
    for (const modal of modals) {
      if (event.target === modal) {
        modal.style.display = "none"
      }
    }
  })

  // Eventos para reiniciar timeout de sesión
  ;["click", "mousemove", "keypress", "scroll", "touchstart"].forEach((event) => {
    document.addEventListener(event, resetSessionTimeout, false)
  })

  // Cerrar sesión al cerrar pestaña
  window.addEventListener("beforeunload", () => {
    sessionStorage.removeItem("loggedInUser")
  })
}

// Formatear números como moneda
function formatCurrency(num) {
  return num.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

// Generar clave dinámica
function generateDynamicKey() {
  const dynamicKey = document.getElementById("dynamicKey")
  const newKey = Math.floor(100000 + Math.random() * 900000)
  dynamicKey.textContent = newKey.toString().replace(/(\d{3})(\d{3})/, "$1 $2")
}

// Simular rotación del temporizador
function simulateTimerCircle() {
  const timerCircle = document.getElementById("timerCircle")
  let rotation = 0
  timerRotationInterval = setInterval(() => {
    rotation += 12 // 360 grados / 30 segundos
    timerCircle.style.transform = `rotate(${rotation}deg)`
  }, 1000)
}

// Renderizar gráfico de movimientos
function renderMovementsChart() {
  const ctx = document.getElementById("movementsChart").getContext("2d")

  const consignaciones = user.info.consignaciones || 0
  const creditos = user.info.creditos || 0
  const pagos = user.info.pagos || 0

  const Chart = window.Chart // Access Chart from global window object
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Consignaciones", "Créditos", "Pagos"],
      datasets: [
        {
          label: "Dólares ($)",
          data: [consignaciones, creditos, pagos],
          backgroundColor: ["rgba(76, 175, 80, 0.8)", "rgba(33, 150, 243, 0.8)", "rgba(255, 152, 0, 0.8)"],
          borderColor: ["rgba(76, 175, 80, 1)", "rgba(33, 150, 243, 1)", "rgba(255, 152, 0, 1)"],
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => "$" + value.toLocaleString(),
          },
        },
      },
    },
  })
}

// Funciones de modales
function openModal() {
  document.getElementById("myModal").style.display = "block"
}

function closeModal() {
  document.getElementById("myModal").style.display = "none"
}

function showBalance() {
  document.getElementById("balanceModal").style.display = "block"
}

function closeBalanceModal() {
  document.getElementById("balanceModal").style.display = "none"
}

function transferMoney() {
  document.getElementById("transferModal").style.display = "block"
}

function closeTransferModal() {
  document.getElementById("transferModal").style.display = "none"
}

// Procesar transferencia
function processTransfer(event) {
  event.preventDefault()

  const submitButton = event.target.querySelector('button[type="submit"]')
  submitButton.disabled = true
  submitButton.textContent = "Procesando..."

  // Simular procesamiento
  setTimeout(() => {
    alert("Esta cuenta se encuentra congelada, hasta que no realice los pagos pertinentes.")
    closeTransferModal()
    submitButton.disabled = false
    submitButton.textContent = "Enviar Transferencia"
    event.target.reset()
  }, 2000)
}

// Funciones de acciones bloqueadas
function withdrawMoney() {
  alert("Esta cuenta se encuentra congelada. Es necesario que se realicen los pagos pertinentes para generar retiros.")
}

function payCredits() {
  alert("Esta cuenta se encuentra congelada, hasta que no realice los pagos pertinentes.")
}

function showFrozenAccountMessage() {
  alert("Esta cuenta se encuentra congelada, hasta que no realice los pagos pertinentes.")
}

// Cerrar sesión
function logout() {
  // Limpiar intervalos
  if (dynamicKeyInterval) clearInterval(dynamicKeyInterval)
  if (timerRotationInterval) clearInterval(timerRotationInterval)
  if (sessionTimeout) clearTimeout(sessionTimeout)

  // Cerrar sesión en Firebase
  auth
    .signOut()
    .then(() => {
      sessionStorage.removeItem("loggedInUser")
      window.location.href = "index.html"
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error)
      sessionStorage.removeItem("loggedInUser")
      window.location.href = "index.html"
    })
}

// Control de sesión por inactividad
function resetSessionTimeout() {
  clearTimeout(sessionTimeout)
  sessionTimeout = setTimeout(
    () => {
      alert("Sesión expirada por inactividad.")
      logout()
    },
    2 * 60 * 1000,
  ) // 2 minutos
}
