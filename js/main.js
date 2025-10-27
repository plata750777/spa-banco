// ✅ Supabase ya está cargado desde el HTML
const supabase = window.supabase.createClient(
 'https://dufhqzqyhjronnrzaira.supabase.co',
 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZmhxenF5aGpyb25ucnphaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjY5ODYsImV4cCI6MjA3NzAwMjk4Nn0.q1rfdDkg2_5I0o_kpBIxKF1V2bpJlcJKDG54-zqu158',
);

// Variables globales
let user
let sessionTimeout
let dynamicKeyInterval
let timerRotationInterval

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
  const session = await fetchUserFromSupabase();

  console.log('Sesión cargada desde sessionStorage:', session);

  if (!session || session.isAdmin) {
    window.location.href = 'index.html';
    return;
  }

  user = session;
  sessionStorage.setItem('loggedInUser', JSON.stringify(user));
  inicializarPagina();
});


// Función principal
function inicializarPagina() {
  cargarDatosUsuario();
  startDynamicKeyCycle();       // 🔄 clave + temporizador sincronizados
  configurarEventos();          // 🎯 listeners y control de sesión
  renderMovementsChart();       // 📊 gráfico de movimientos
  resetSessionTimeout();        // ⏱️ control de inactividad
}


// Cargar datos del usuario en la interfaz
function cargarDatosUsuario() {
  if (!user || !user.info) {
    console.warn('Datos de usuario no disponibles');
    return;
  }

  const info = user.info;

  // Helper para texto plano
  const setText = (id, value) => {
    document.getElementById(id).textContent = value || 'N/A';
  };

  // Helper para valores monetarios
  const setCurrency = (id, value) => {
    document.getElementById(id).textContent = formatCurrency(value);
  };

  // Datos principales
  setText('userGreeting', `Hola, ${info.nombre || 'Usuario'}`);
  setText('accountNumber', `Número de Cuenta: ${info.cuenta}`);
  setCurrency('accountBalance', info.saldoAhorros);
  setText('accountType', `Tipo de Cuenta: ${info.tipoCuenta || 'Ahorros'}`);

  // Modal
  setText('modalAccountNumber', info.cuenta);
  setText('modalAccountType', info.tipoCuenta || 'Cuenta Ahorros');
  setText('modalOpeningDate', info.fechaApertura);
  setText('modalInterestRate', info.tasaInteres !== undefined ? `${info.tasaInteres}% EA` : '1.5% EA');

  // Saldos
  setCurrency('savingsBalance', info.saldoAhorros);
  setCurrency('currentBalance', info.saldoCorriente);
  setCurrency('creditCardBalance', info.saldoTarjeta);

  // Información adicional
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
  `;
}

// Formatear como moneda
function formatCurrency(valor) {
  const num = Number(valor);
  return isNaN(num)
    ? '$0.00'
    : num.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}



// Clave dinámica
// 🔐 Genera una nueva clave dinámica cada 30s
function generateDynamicKey() {
  const newKey = Math.floor(100000 + Math.random() * 900000);
  const formattedKey = newKey.toString().replace(/(\d{3})(\d{3})/, '$1 $2');

  const keyElement = document.getElementById('dynamicKey');
  if (keyElement) keyElement.textContent = formattedKey;
}

// 🔄 Temporizador visual sincronizado con la clave
function simulateTimerCircle() {
  const timerCircle = document.getElementById('timerCircle');
  if (!timerCircle) return;

  let secondsElapsed = 0;
  timerCircle.style.transform = 'rotate(0deg)';

  timerRotationInterval = setInterval(() => {
    secondsElapsed++;
    const rotation = (secondsElapsed / 30) * 360;
    timerCircle.style.transform = `rotate(${rotation}deg)`;

    if (secondsElapsed >= 30) {
      secondsElapsed = 0;
      generateDynamicKey(); // sincroniza con nueva clave
    }
  }, 1000);
}

// 🧩 Inicia ambos ciclos sincronizados
function startDynamicKeyCycle() {
  generateDynamicKey(); // clave inicial
  simulateTimerCircle(); // temporizador visual
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
  // ✅ Cierre de sesión con redirección
  document.getElementById('logoutBtn').addEventListener('click', () => {
    logout({ auto: false, redirect: 'index.html' });
  });

  // ✅ Envío de formulario de transferencia
  document.getElementById('transferForm').addEventListener('submit', processTransfer);

  // ✅ Cierre de modales al hacer clic fuera
  window.addEventListener('click', (event) => {
    for (const modal of document.getElementsByClassName('modal')) {
      if (event.target === modal) modal.style.display = 'none';
    }
  });

  // ✅ Reinicio de temporizador de sesión por actividad
  ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach((event) => {
    document.addEventListener(event, resetSessionTimeout, false);
  });

  // ✅ Limpieza de sesión al cerrar pestaña
  window.addEventListener('beforeunload', () => {
    sessionStorage.removeItem('loggedInUser');
  });
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

// Cierre de sesión (manual o automático)
function logout({ auto = false, redirect = 'index.html' } = {}) {
  try {
    // Detener intervalos activos
    if (typeof dynamicKeyInterval !== 'undefined') clearInterval(dynamicKeyInterval);
    if (typeof timerRotationInterval !== 'undefined') clearInterval(timerRotationInterval);
    if (typeof sessionTimeout !== 'undefined') clearTimeout(sessionTimeout);

    // Limpiar sesión local
    sessionStorage.removeItem('loggedInUser');

    // Cierre en Supabase (si aplica)
    if (typeof supabase !== 'undefined') {
      supabase.auth.signOut().catch(err => console.warn('Error al cerrar sesión Supabase:', err));
    }

    // Mensaje si es automático
    if (auto) alert('Sesión expirada por inactividad.');

    // Redirigir
    window.location.href = redirect;
  } catch (err) {
    console.error('Error en logout:', err);
  }
}

// Control de sesión por inactividad
function resetSessionTimeout() {
  if (typeof sessionTimeout !== 'undefined') clearTimeout(sessionTimeout);
  sessionTimeout = setTimeout(() => logout({ auto: true }), 2 * 60 * 1000); // 2 minutos
}

// Reiniciar temporizador en cada interacción
['click', 'mousemove', 'keydown'].forEach(evt =>
  document.addEventListener(evt, resetSessionTimeout)
);

async function fetchUserFromSupabase() {
  const session = JSON.parse(sessionStorage.getItem('loggedInUser'));
  if (!session?.user?.id) return null;

  const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
  if (error) {
    console.warn('Error al obtener usuario desde Supabase:', error.message);
    return null;
  }

  return { ...session, info: data };
}
async function actualizarDatosDesdeSupabase() {
  const session = await fetchUserFromSupabase();
  if (!session || session.isAdmin) return;

  user = session;
  sessionStorage.setItem('loggedInUser', JSON.stringify(user));
  cargarDatosUsuario();
  renderMovementsChart();
}
