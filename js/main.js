// ELIMINADO: La clave API y la inicialización de Supabase están ELIMINADAS del frontend.
// La autenticación y carga de datos ahora se manejan exclusivamente a través de la API segura de Vercel.

// Variables globales
let user;
let sessionTimeout;
let timerRotationInterval;
let movementsChart;
const apiUrl = '/api'; // Endpoint base del servidor Vercel

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar la sesión: ahora solo se comprueba la existencia de la sesión local.
    const sessionData = sessionStorage.getItem('loggedInUser');
    if (!sessionData) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Cargar los datos del usuario a través del servidor seguro
    await fetchAndLoadUserData();
});

// 🔒 FUNCIÓN CRÍTICA: Carga datos del usuario desde el servidor blindado (/api/data)
async function fetchAndLoadUserData() {
    try {
        const response = await fetch(`${apiUrl}/data`, {
            method: 'GET',
            headers: {
                // El servidor Vercel (/api/data) leerá la cookie HttpOnly que /api/login estableció.
                'Content-Type': 'application/json' 
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            // El servidor devolvió un error (401 o 404): sesión inválida o datos no encontrados
            throw new Error(data.error || 'Sesión no válida o datos inaccesibles.');
        }

        // Si es exitoso, los datos vienen del servidor Vercel
        user = data; 
        sessionStorage.setItem('loggedInUser', JSON.stringify(user)); // Mantener el estado local

        inicializarPagina();
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error.message);
        // Fallo en la verificación del servidor: Cerrar sesión
        logout({ auto: true, message: 'La sesión ha expirado o es inválida.' });
    }
}


// Función principal
function inicializarPagina() {
    cargarDatosUsuario();
    startDynamicKeyCycle();        // 🔄 clave + temporizador
    configurarEventos();           // 🎯 listeners y control de sesión
    renderMovementsChart();        // 📊 gráfico de movimientos
    resetSessionTimeout();         // ⏱️ control de inactividad
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
        const el = document.getElementById(id);
        if (el) el.textContent = value || 'N/A';
    };

    // Helper para valores monetarios
    const setCurrency = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = formatCurrency(value);
    };

    // Datos principales
    setText('userGreeting', `Hola, ${info.nombre || 'Cliente'}`);
    setText('accountNumber', `Número de Cuenta: ${info.cuenta}`);
    setCurrency('accountBalance', info.saldoAhorros);
    setText('accountType', `Tipo de Cuenta: ${info.tipoCuenta || 'Cuenta Ahorros'}`);

    // Modal
    setText('modalAccountNumber', info.cuenta);
    setText('modalAccountType', info.tipoCuenta || 'Cuenta Ahorros');
    setText('modalOpeningDate', info.fechaApertura);
    setText('modalInterestRate', info.tasaInteres !== undefined ? `${info.tasaInteres}% EA` : '1.5% EA');

    // Saldos
    setCurrency('savingsBalance', info.saldoAhorros);
    setCurrency('currentBalance', info.saldoCorriente);
    setCurrency('creditCardBalance', info.saldoTarjeta);

    // Información adicional (usando el lenguaje directo)
    document.getElementById('additionalInfo').innerHTML = `
        <h2>Información Personal de Cliente</h2>
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


// Clave dinámica (Solo visual, no criptográfica)
function generateDynamicKey() {
    const newKey = Math.floor(100000 + Math.random() * 900000);
    const formattedKey = newKey.toString().replace(/(\d{3})(\d{3})/, '$1 $2');
    const keyElement = document.getElementById('dynamicKey');
    if (keyElement) keyElement.textContent = formattedKey;
}

// Temporizador visual sincronizado
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
            generateDynamicKey();
        }
    }, 1000);
}

// Inicia ambos ciclos sincronizados
function startDynamicKeyCycle() {
    generateDynamicKey();
    simulateTimerCircle();
}


// Gráfico de movimientos
function renderMovementsChart() {
    const ctx = document.getElementById('movementsChart').getContext('2d');
    const info = user.info;

    if (movementsChart) {
        movementsChart.destroy();
    }

    movementsChart = new Chart(ctx, {
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
    });
}


// Eventos
function configurarEventos() {
    // 🔒 Cierre de sesión con redirección (Usa endpoint seguro /api/logout)
    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout({ auto: false, redirect: 'index.html' });
    });

    // 🔒 Envío de formulario de transferencia (Simulación de bloqueo local)
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


// Modales y Acciones Bloqueadas
function openModal() { document.getElementById('myModal').style.display = 'block'; }
function closeModal() { document.getElementById('myModal').style.display = 'none'; }
function showBalance() { document.getElementById('balanceModal').style.display = 'block'; }
function closeBalanceModal() { document.getElementById('balanceModal').style.display = 'none'; }
function transferMoney() { document.getElementById('transferModal').style.display = 'block'; }
function closeTransferModal() { document.getElementById('transferModal').style.display = 'none'; }

function withdrawMoney() { alert('Esta cuenta se encuentra congelada. Contacte a soporte.'); }
function payCredits() { alert('Esta cuenta se encuentra congelada. Contacte a soporte.'); }
function showFrozenAccountMessage() { alert('Esta cuenta se encuentra congelada. Contacte a soporte.'); }


// 🔒 FUNCIÓN CRÍTICA: Simulación de bloqueo de transferencia (Local)
function processTransfer(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    
    // Aunque es simulación, se extraen los datos para la ilusión de operación.
    submitButton.disabled = true;
    submitButton.textContent = 'Verificando Sistema...'; 

    // Simulación de Bloqueo Local (con delay para parecer una respuesta de servidor)
    setTimeout(() => {
        alert('OPERACIÓN DENEGADA (Código 403-S). Esta cuenta tiene restricciones de salida pendientes. Contacte a su gestor para desbloquear.');
        
        closeTransferModal();

        submitButton.disabled = false;
        submitButton.textContent = 'Procesar Transferencia';
        event.target.reset();

    }, 1500); 
}


// Cierre de sesión (manual o automático)
async function logout({ auto = false, redirect = 'index.html', message } = {}) {
    // Detener intervalos activos
    if (typeof timerRotationInterval !== 'undefined') clearInterval(timerRotationInterval);
    if (typeof sessionTimeout !== 'undefined') clearTimeout(sessionTimeout);

    // Limpiar sesión local
    sessionStorage.removeItem('loggedInUser');

    // 🔒 Notificar al servidor seguro para invalidar la cookie HttpOnly
    // El servidor (/api/logout) se encarga de invalidar la cookie más segura.
    try {
        await fetch(`${apiUrl}/logout`, { method: 'POST' });
    } catch (err) {
        console.warn('Error al notificar logout al servidor seguro:', err);
    }
    
    // Mensaje si es automático
    if (auto && message) alert(message);

    // Redirigir
    window.location.href = redirect;
}

// Control de sesión por inactividad
function resetSessionTimeout() {
    if (typeof sessionTimeout !== 'undefined') clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => logout({ auto: true, message: 'Sesión expirada por inactividad.' }), 5 * 60 * 1000); // 5 minutos
}

// Reiniciar temporizador en cada interacción (listener)
['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt =>
    document.addEventListener(evt, resetSessionTimeout)
);