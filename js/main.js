// ✅ Supabase ya está cargado desde el HTML
const supabase = window.supabase.createClient(
  'https://dufhqzqyhjronnrzaira.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
)

// Variables globales
let user
let sessionTimeout
let dynamicKeyInterval
let timerRotationInterval

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
  user = JSON.parse(sessionStorage.getItem('loggedInUser'))

  if (!user || user.isAdmin) {
    window.location.href = 'index.html'
    return
  }

  inicializarPagina()
})

// Función principal
function inicializarPagina() {
  cargarDatosUsuario()
  generateDynamicKey()
  dynamicKeyInterval = setInterval(generateDynamicKey, 30000)
  simulateTimerCircle()
  configurarEventos()
  renderMovementsChart()
  resetSessionTimeout()
}

// Cargar datos del usuario en la interfaz
function cargarDatosUsuario() {
  const info = user.info

  document.getElementById('userGreeting').textContent = `Hola, ${info.nombre}`
  document.getElementById('accountNumber').textContent = `Número de Cuenta: ${info.cuenta}`
  document.getElementById('accountBalance').textContent = `Saldo disponible: ${formatCurrency(info.saldoAhorros)}`
  document.getElementById('accountType').textContent = `Tipo de Cuenta: ${info.tipoCuenta || 'Ahorros'}`

  document.getElementById('modalAccountNumber').textContent = info.cuenta
  document.getElementById('modalAccountType').textContent = info.tipoCuenta || 'Cuenta Ahorros'
  document.getElementById('modalOpeningDate').textContent = info.fechaApertura || 'N/A'
  document.getElementById('modalInterestRate').textContent = info.tasaInteres !== undefined ? `${info.tasaInteres}% EA` : '1.5% EA'

  document.getElementById('savingsBalance').textContent = formatCurrency(info.saldoAhorros)
  document.getElementById('currentBalance').textContent = formatCurrency(info.saldoCorriente)
  document.getElementById('creditCardBalance').textContent = formatCurrency(info.saldoTarjeta)

  document.getElementById('additionalInfo').innerHTML = `
    <h2>Información Personal</h2>
    <p><strong>Dirección:</strong> ${info.direccion || 'N/A'}</p>
    <p><strong>Correo:</strong> ${info.correo || 'N/A'}</p>
    <p><strong>Tiempo de residencia:</strong> ${info.residencia || 'N/A'}</p>
    <p><strong>Estado civil:</strong> ${info.estadoCivil || 'N/A'}</p>
    <p><strong>Personas a cargo:</strong> ${info.personasCargo || 'N/A'}</p>
    <p><strong>Trabajo actual:</strong> ${info.trabajo || 'N/A'}</p>
    <p><strong>Salario mensual:</strong> ${info.salario !== null ? formatCurrency(info.salario) : 'N/A'}</p>
    <p><strong>Gastos mensuales:</strong> ${info.gastos !== null ? formatCurrency(info.gastos) : 'N/A'}</p>
    <p><strong>Deudas:</strong> ${info.deudas !== null ? formatCurrency(info.deudas) : 'N/A'}</p>
    <p><strong>Inversiones:</strong> ${info.inversiones !== null ? formatCurrency(info.inversiones) : 'N/A'}</p>
  `
}

// Formatear como moneda
function formatCurrency(num) {
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

// Clave dinámica
function generateDynamicKey() {
  const newKey = Math.floor(100000 + Math.random() * 900000)
  document.getElementById('dynamicKey').textContent = newKey.toString().replace(/(\d{3})(\d{3})/, '$1 $2')
}

// Temporizador visual
function simulateTimerCircle() {
  const timerCircle = document.getElementById('timerCircle')
  let rotation = 0
  timerRotationInterval = setInterval(() => {
    rotation += 12
    timerCircle.style.transform = `rotate(${rotation}deg)`
  }, 1000)
}

// Gráfico de movimientos
function renderMovementsChart() {
  const ctx = document.getElementById('movementsChart').getContext('2d')
  const info = user.info

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Consignaciones', 'Créditos', 'Pagos'],
      datasets: [{
        label: 'Dólares ($)',
        data: [info.consignaciones || 0, info.creditos || 0, info.pagos || 0],
        backgroundColor: ['rgba(76,175,80,0.8)', 'rgba(33,150,243,0.8)', 'rgba(255,152,0,0.8)'],
        borderColor: ['rgba(76,175,80,1)', 'rgba(33,150,243,1)', 'rgba(255,152,0,1)'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: true, position: 'top' } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => '$' + value.toLocaleString()
          }
        }
      }
    }
  })
}

// Eventos
function configurarEventos() {
  document.getElementById('logoutBtn').addEventListener('click', logout)
  document.getElementById('transferForm').addEventListener('submit', processTransfer)

  window.addEventListener('click', (event) => {
    for (const modal of document.getElementsByClassName('modal')) {
      if (event.target === modal) modal.style.display = 'none'
    }
  })

  ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach((event) => {
    document.addEventListener(event, resetSessionTimeout, false)
  })

  window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem('loggedInUser')
  })
}

// Modales
function openModal() { document.getElementById('myModal').style.display = 'block' }
function closeModal() { document.getElementById('myModal').style.display = 'none' }
function showBalance() { document.getElementById('balanceModal').style.display = 'block' }
function closeBalanceModal() { document.getElementById('balanceModal').style.display = 'none' }
function transferMoney() { document.getElementById('transferModal').style.display = 'block' }
function closeTransferModal() { document.getElementById('transferModal').style.display = 'none' }

// Acciones bloqueadas
function withdrawMoney() { alert('Esta cuenta se encuentra congelada.') }
function payCredits() { alert('Esta cuenta se encuentra congelada.') }
function showFrozenAccountMessage() { alert('Esta cuenta se encuentra congelada.') }

// Simulación de transferencia
function processTransfer(event) {
  event.preventDefault()
  const submitButton = event.target.querySelector('button[type="submit"]')
  submitButton.disabled = true
  submitButton.textContent = 'Procesando...'

  setTimeout(() => {
    alert('Esta cuenta se encuentra congelada, hasta que no realice los pagos pertinentes.')
    closeTransferModal()
    submitButton.disabled = false
    submitButton.textContent = 'Enviar Transferencia'
    event.target.reset()
  }, 2000)
}

// Cerrar sesión
function logout() {
  clearInterval(dynamicKeyInterval)
  clearInterval(timerRotationInterval)
  clearTimeout(sessionTimeout)
  sessionStorage.removeItem('loggedInUser')
  window.location.href = 'index.html'
}

// Control de sesión por inactividad
function resetSessionTimeout() {
  clearTimeout(sessionTimeout)
  sessionTimeout = setTimeout(() => {
    alert('Sesión expirada por inactividad.')
    logout()
  }, 2 * 60 * 1000)
}
