const BASE_API_URL = 'https://cryptobroker-pi.vercel.app/';
let user; // Esta variable global ahora se llenará con los datos del backend
let sessionTimeout;
let timerInterval;
let timeLeft = 30;
let chartInstance = null;
let movementsChartCanvasChart = null; // Para el gráfico de movimientos
let currentFromCurrency = "BTC";
let currentToCurrency = "USD";
let historicalData = [];
let currentConversionRate = 0;

// Elementos del DOM (declarados aquí, asignados en getDOMElements)
let userGreetingElement, dynamicKeyElement, timerCircleElement; // userNameElement eliminado
let amountInput, fromCurrencySelect, toCurrencySelect, convertButton, resultDisplay, switchButton, chartCanvas, estimatedRateDisplay;
let accountBalanceElement, accountNumberElement, accountTypeElement;
let savingsBalanceElement, currentBalanceElement, creditCardBalanceElement; // Corregido nombre de variable
let modalAccountNumberElement, modalAccountTypeElement, modalOpeningDateElement, modalInterestRateElement;
let additionalInfoElement;
let movementsChartCanvas; // Para el canvas del gráfico de movimientos

const apiKey = "a70629e5d37181b7471dff177bb52c5d4a6995b0ccc9e8a02c28892cfc55f5f7";
const apiUrl = "https://min-api.cryptocompare.com/data/price?fsym=";
const historyApiUrl = "https://min-api.cryptocompare.com/data/v2/histoday?fsym=";

const cryptoCurrencies = [
    "BTC", "ETH", "LTC", "XRP", "ADA", "DOT", "BNB", "LINK", "SOL", "USDT", "BCH", "XLM", "DOGE", "SHIB",
];
const fiatCurrencies = [
    "USD", "EUR", "GBP", "JPY", "ARS", "BRL", "COP", "MXN", "CLP", "PEN", "UYU",
];

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded: Evento disparado.'); // <--- DEBUG LOG
    const authToken = sessionStorage.getItem('authToken');
    const loggedInUserString = sessionStorage.getItem('loggedInUser');

    let loggedInUser;
    try {
        loggedInUser = loggedInUserString ? JSON.parse(loggedInUserString) : null;
    } catch (e) {
        console.error("Error al parsear loggedInUser de sessionStorage:", e);
        loggedInUser = null;
    }

    // --- Verificación de Autenticación al cargar la página ---
    if (!authToken || !loggedInUser || loggedInUser.isAdmin) {
        alert('Acceso denegado. Por favor, inicia sesión como usuario normal.');
        sessionStorage.clear(); // Limpia cualquier sesión inválida
        window.location.href = 'index.html'; // Redirige al login
        return; // Detiene la ejecución del script
    }

    user = loggedInUser; // Asigna a la variable global 'user'
    console.log('Usuario logueado en main.html:', user.username); // Para depuración

    // Obtener las referencias a los elementos del DOM después de la verificación de autenticación
    getDOMElements();
    console.log('DOMContentLoaded: getDOMElements ejecutado.'); // <--- DEBUG LOG

    inicializarPagina();
    console.log('DOMContentLoaded: inicializarPagina ejecutado.'); // <--- DEBUG LOG

    inicializarConverter();
    console.log('DOMContentLoaded: inicializarConverter ejecutado.'); // <--- DEBUG LOG

    setupSessionTimeout();
    console.log('DOMContentLoaded: setupSessionTimeout ejecutado.'); // <--- DEBUG LOG
});

// --- Funciones de Utilidad y Lógica Principal ---

function getDOMElements() {
    console.log('getDOMElements: Iniciando...'); // <--- DEBUG LOG
    // Referencias a elementos del header
    userGreetingElement = document.getElementById('userGreeting');
    // userNameElement eliminado, ya que no existe en main.html
    dynamicKeyElement = document.getElementById('dynamicKey');
    timerCircleElement = document.getElementById('timerCircle');

    // Referencias a elementos de la billetera principal
    accountBalanceElement = document.getElementById('accountBalance');
    accountNumberElement = document.getElementById('accountNumber');
    accountTypeElement = document.getElementById('accountType');

    // Referencias a elementos de saldos del modal
    savingsBalanceElement = document.getElementById('savingsBalance');
    currentBalanceElement = document.getElementById('currentBalance');
    creditCardBalanceElement = document.getElementById('creditCardBalance'); // Corregido

    // Referencias a saldos de criptomonedas (si tienes estos IDs en tu HTML)
    balanceBTCElement = document.getElementById('balanceBTC');
    balanceETHElement = document.getElementById('balanceETH');
    balanceUSDTElement = document.getElementById('balanceUSDT');

    // Referencias a elementos del modal de detalles de billetera
    modalAccountNumberElement = document.getElementById('modalAccountNumber');
    modalAccountTypeElement = document.getElementById('modalAccountType');
    modalOpeningDateElement = document.getElementById('modalOpeningDate');
    modalInterestRateElement = document.getElementById('modalInterestRate');

    // Referencias a información adicional y gráficos
    additionalInfoElement = document.getElementById('additionalInfo');
    movementsChartCanvas = document.getElementById('movementsChart');

    // Referencias a elementos del convertidor
    amountInput = document.getElementById("amount");
    fromCurrencySelect = document.getElementById("from-currency-select");
    toCurrencySelect = document.getElementById("to-currency-select");
    convertButton = document.getElementById("convert-button");
    resultDisplay = document.getElementById("result");
    switchButton = document.getElementById("switch-currencies");
    chartCanvas = document.getElementById("crypto-chart");
    estimatedRateDisplay = document.getElementById("estimated-rate");

    console.log('getDOMElements: Elementos del convertidor obtenidos:', { // <--- DEBUG LOG
        amountInput: !!amountInput, // Convertir a boolean para saber si se encontró
        fromCurrencySelect: !!fromCurrencySelect,
        toCurrencySelect: !!toCurrencySelect,
        convertButton: !!convertButton,
        resultDisplay: !!resultDisplay,
        switchButton: !!switchButton,
        chartCanvas: !!chartCanvas,
        estimatedRateDisplay: !!estimatedRateDisplay
    });
}

function inicializarPagina() {
    const userInfo = user.info || {}; // Asegura que userInfo sea un objeto

    // --- Mostrar el saludo y el nombre de usuario ---
    // userGreetingElement es el h1 con ID "userGreeting"
    if (userGreetingElement) {
        userGreetingElement.textContent = `Hola, ${userInfo.nombre || user.username || 'Usuario'}`;
    }

    // --- Mostrar la clave de seguridad (dinámica) ---
    if (dynamicKeyElement) {
        generateDynamicKey(); // Genera la clave inicial aleatoria
        setInterval(generateDynamicKey, 30000); // Actualiza cada 30 segundos
        // Nota: simulateTimerCircle() no está definido en el código proporcionado
        // Esto podría ser un error si es una función que esperas que exista
        // Si no la tienes, esta línea causaría un error
        // simulateTimerCircle(); // Inicia la animación del círculo del temporizador
    }

    // --- Mostrar información de la billetera principal ---
    if (accountNumberElement) accountNumberElement.textContent = 'ID de Billetera: ' + (userInfo.cuenta || 'N/A');
    if (accountBalanceElement) accountBalanceElement.innerHTML = 'Saldo disponible: ' + formatCurrencyUSD(userInfo.saldoAhorros || 0);
    if (accountTypeElement) accountTypeElement.textContent = 'Tipo de Cuenta: ' + (userInfo.tipoCuenta || 'Principal');

    // --- Mostrar saldos en el modal de saldos (Bitcoin, Ethereum, USDT) ---
    // Estos IDs son para los <p> dentro del modal de saldos
    if (savingsBalanceElement) savingsBalanceElement.textContent = `Bitcoin (BTC): ${formatCrypto(userInfo.saldoBTC || 0)} BTC`;
    if (currentBalanceElement) currentBalanceElement.textContent = `Ethereum (ETH): ${formatCrypto(userInfo.saldoETH || 0)} ETH`;
    if (creditCardBalanceElement) creditCardBalanceElement.textContent = `US Dollar (USD): ${formatCurrencyUSD(userInfo.saldoUSDT || 0)}`; // Corregido

    // --- Mostrar saldos de criptomonedas individuales (si tienes estos IDs en HTML) ---
    // Estos IDs son para elementos fuera de los modales, si existen
    if (balanceBTCElement) balanceBTCElement.textContent = `${formatCrypto(userInfo.saldoBTC || 0)} BTC`;
    if (balanceETHElement) balanceETHElement.textContent = `${formatCrypto(userInfo.saldoETH || 0)} ETH`;
    if (balanceUSDTElement) balanceUSDTElement.textContent = `${formatCrypto(userInfo.saldoUSDT || 0)} USDT`;


    // --- Rellenar el modal de detalles de la billetera ---
    if (modalAccountNumberElement) modalAccountNumberElement.textContent = userInfo.cuenta || 'N/A';
    if (modalAccountTypeElement) modalAccountTypeElement.textContent = userInfo.tipoCuenta || 'Cuenta Ahorros';
    if (modalOpeningDateElement) modalOpeningDateElement.textContent = userInfo.fechaApertura || 'N/A';
    if (modalInterestRateElement) modalInterestRateElement.textContent = userInfo.tasaInteres !== undefined ? userInfo.tasaInteres + '% EA' : '1.5% EA';

    // --- Llenar información adicional (incluyendo métricas de broker) ---
    if (additionalInfoElement) {
        additionalInfoElement.innerHTML = `
            <h2>Información Personal</h2>
            <p><strong>Dirección:</strong> ${userInfo.direccion || 'N/A'}</p>
            <p><strong>Correo:</strong> ${userInfo.correo || 'N/A'}</p>
            <p><strong>Tiempo de residencia:</strong> ${userInfo.residencia || 'N/A'}</p>
            <p><strong>Estado civil:</strong> ${userInfo.estadoCivil || 'N/A'}</p>
            <p><strong>Personas a cargo:</strong> ${userInfo.personasCargo || 'N/A'}</p>
            <p><strong>Trabajo actual:</strong> ${userInfo.trabajo || 'N/A'}</p>
            <p><strong>Salario mensual:</strong> ${userInfo.salario !== undefined && userInfo.salario !== null ? formatCurrencyUSD(userInfo.salario) : 'N/A'}</p>
            <p><strong>Gastos mensuales:</strong> ${userInfo.gastos !== undefined && userInfo.gastos !== null ? formatCurrencyUSD(userInfo.gastos) : 'N/A'}</p>
            <p><strong>Deudas:</strong> ${userInfo.deudas !== undefined && userInfo.deudas !== null ? formatCurrencyUSD(userInfo.deudas) : 'N/A'}</p>
            <p><strong>Inversiones:</strong> ${userInfo.inversiones !== undefined && userInfo.inversiones !== null ? formatCurrencyUSD(userInfo.inversiones) : 'N/A'}</p>
            
            <h2>Métricas de Broker</h2>
            <p><strong>Valor de Portafolio:</strong> ${userInfo.portfolioValueUSD !== undefined && userInfo.portfolioValueUSD !== null ? formatCurrencyUSD(userInfo.portfolioValueUSD) : 'N/A'}</p>
            <p><strong>Total Depósitos:</strong> ${userInfo.totalDepositsUSD !== undefined && userInfo.totalDepositsUSD !== null ? formatCurrencyUSD(userInfo.totalDepositsUSD) : 'N/A'}</p>
            <p><strong>Total Retiros:</strong> ${userInfo.totalWithdrawalsUSD !== undefined && userInfo.totalWithdrawalsUSD !== null ? formatCurrencyUSD(userInfo.totalWithdrawalsUSD) : 'N/A'}</p>
            <p><strong>Volumen de Trading:</strong> ${userInfo.tradingVolumeUSD !== undefined && userInfo.tradingVolumeUSD !== null ? formatCurrencyUSD(userInfo.tradingVolumeUSD) : 'N/A'}</p>
        `;
    }

    renderMovementsChart(); // Renderiza el gráfico de movimientos
}

function generateDynamicKey() {
    const key = Math.floor(100000 + Math.random() * 900000);
    if (dynamicKeyElement) {
        dynamicKeyElement.textContent = key.toString().replace(/\d{3}(?=(\d{3}))/g, '$& ');
        resetTimer(); // Reinicia el temporizador visual
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timeLeft = 30;
    updateTimerCircle(timeLeft);
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    timeLeft--;
    updateTimerCircle(timeLeft);
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        generateDynamicKey(); // Genera una nueva clave cuando el tiempo se agota
    }
}

function updateTimerCircle(seconds) {
    if (timerCircleElement) {
        const angle = (seconds / 30) * 360;
        timerCircleElement.style.backgroundImage = `conic-gradient(#4CAF50 ${angle}deg, #ddd ${angle}deg)`;
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}

function setupSessionTimeout() {
    ['click', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(function(event) {
        document.addEventListener(event, resetTimeout, false);
    });
    resetTimeout();
    // window.addEventListener('beforeunload', function() {}); // Esta línea no es necesaria para el timeout
}

function resetTimeout() {
    clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(function() {
        alert('Sesión expirada por inactividad.');
        logout();
    }, 120000); // 2 minutos (120000 ms)
}

// --- Funciones de Modales y Acciones ---
function transferMoney() {
    document.getElementById('transferModal').style.display = 'block';
}

function closeTransferModal() {
    document.getElementById('transferModal').style.display = 'none';
}

function processTransfer(event) {
    event.preventDefault();
    const transferButton = document.querySelector('#transferModal .transfer-form button[type="submit"]');
    if (transferButton) {
        transferButton.disabled = true;
        transferButton.textContent = 'Procesando...';
    }

    setTimeout(() => {
        alert('Esta cuenta se encuentra congelada, hasta que no realice los pagos pertinentes.');
        closeTransferModal();
        if (transferButton) {
            transferButton.disabled = false;
            transferButton.textContent = 'Enviar';
        }
    }, 2000);
}

function withdrawMoney() {
    showFrozenAccountMessage();
}

function payCredits() {
    showFrozenAccountMessage();
}

function showFrozenAccountMessage() {
    alert('Esta cuenta se encuentra congelada, hasta que no realice los pagos pertinentes.');
}

function showBalance() {
    document.getElementById('balanceModal').style.display = 'block';
}

function closeBalanceModal() {
    document.getElementById('balanceModal').style.display = 'none';
}

function openModal() {
    document.getElementById('myModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('myModal').style.display = 'none';
}

window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
}

// --- Funciones de Gráficos ---
function renderMovementsChart() {
    if (!movementsChartCanvas) {
        console.warn("Elemento canvas para movimientos bancarios no encontrado. El gráfico no se renderizará.");
        return;
    }

    const ctx = movementsChartCanvas.getContext('2d');

    if (movementsChartCanvasChart) {
        movementsChartCanvasChart.destroy();
    }

    const consignaciones = (user.info && user.info.consignaciones) || 0;
    const creditos = (user.info && user.info.creditos) || 0;
    const pagos = (user.info && user.info.pagos) || 0;

    movementsChartCanvasChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Consignaciones', 'Créditos', 'Pagos'],
            datasets: [{
                label: 'Dólares ($)',
                data: [consignaciones, creditos, pagos],
                backgroundColor: ['#4CAF50', '#2196F3', '#FF9800']
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrencyUSD(value);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// --- Funciones del Convertidor de Criptomonedas ---
async function getConversionRate(fromCurrency, toCurrency) {
    console.log(`getConversionRate: Obteniendo tasa para ${fromCurrency} a ${toCurrency}`); // <--- DEBUG LOG
    if (fromCurrency === toCurrency) {
        currentConversionRate = 1;
        console.log('getConversionRate: Monedas iguales, tasa 1.'); // <--- DEBUG LOG
        return 1;
    }

    try {
        const isValidFrom = cryptoCurrencies.includes(fromCurrency) || fiatCurrencies.includes(fromCurrency);
        const isValidTo = cryptoCurrencies.includes(toCurrency) || fiatCurrencies.includes(toCurrency);

        if (!isValidFrom || !isValidTo) {
            console.error(`getConversionRate: Moneda no válida: ${fromCurrency} o ${toCurrency}`); // <--- DEBUG LOG
            throw new Error(`Moneda no válida: ${fromCurrency} o ${toCurrency}`);
        }

        console.log(`getConversionRate: Realizando fetch a ${apiUrl}${fromCurrency}&tsyms=${toCurrency}&api_key=${apiKey}`); // <--- DEBUG LOG
        const response = await fetch(
            `${apiUrl}${fromCurrency}&tsyms=${toCurrency}&api_key=${apiKey}`
        );
        const data = await response.json();

        if (data && data[toCurrency]) {
            currentConversionRate = data[toCurrency];
            console.log(`getConversionRate: Tasa obtenida: ${currentConversionRate}`); // <--- DEBUG LOG
            return data[toCurrency];
        } else if (data && data.Response === 'Error') {
            console.error(`getConversionRate: Error de API: ${data.Message}`); // <--- DEBUG LOG
            throw new Error(`Error de API: ${data.Message}`);
        } else {
            console.error(`getConversionRate: Respuesta inesperada de la API:`, data); // <--- DEBUG LOG
            throw new Error(
                `No se pudo obtener la tasa de conversión para ${fromCurrency} a ${toCurrency}`
            );
        }
    } catch (error) {
        console.error("Error al obtener la tasa de conversión (catch):", error); // <--- DEBUG LOG
        if (estimatedRateDisplay) estimatedRateDisplay.textContent = "Error al cargar la tasa.";
        if (resultDisplay) resultDisplay.textContent = "Error al obtener la tasa de conversión.";
        currentConversionRate = 0;
        return null;
    }
}

async function getHistoricalData(fromCurrency, toCurrency) {
    try {
        const response = await fetch(
            `${historyApiUrl}${fromCurrency}&tsym=${toCurrency}&limit=30&api_key=${apiKey}`
        );
        const data = await response.json();

        if (data && data.Data && data.Data.Data && data.Data.Data.length > 0) {
            historicalData = data.Data.Data.map((item) => ({
                date: new Date(item.time * 1000).toLocaleDateString(),
                price: item.close,
            }));
            return historicalData;
        } else {
            console.warn(`No se pudieron obtener datos históricos para ${fromCurrency} a ${toCurrency} o los datos están vacíos.`);
            return [];
        }
    } catch (error) {
        console.error("Error al obtener datos históricos:", error);
        return [];
    }
}

// Esta función es llamada por updateConverterUI, pero no está definida en el código que me diste.
// Si no existe, causará un ReferenceError.
// Es probable que necesites implementarla o eliminar su llamada.
// async function updateEstimatedRate(fromCurrency, toCurrency) {
//     // Implementa la lógica para actualizar la tasa estimada aquí
//     // Por ejemplo:
//     // const rate = await getConversionRate(fromCurrency, toCurrency);
//     // if (estimatedRateDisplay) {
//     //     estimatedRateDisplay.textContent = `Tasa Estimada: 1 ${fromCurrency} ~ ${rate ? rate.toFixed(8) : 'N/A'} ${toCurrency}`;
//     // }
// }


async function updateConverterUI() {
    console.log('updateConverterUI: Iniciando...'); // <--- DEBUG LOG
    if (!amountInput || !fromCurrencySelect || !toCurrencySelect || !resultDisplay || !estimatedRateDisplay || !chartCanvas) {
        console.error("Elementos del conversor no encontrados en el DOM. Fallo al actualizar UI.");
        return;
    }

    const amount = parseFloat(amountInput.value);
    currentFromCurrency = fromCurrencySelect.value;
    currentToCurrency = toCurrencySelect.value;

    if (isNaN(amount) || amount <= 0) {
        resultDisplay.textContent = "Ingrese un monto válido.";
        estimatedRateDisplay.textContent = "";
        // createChart([], currentFromCurrency, currentToCurrency); // createChart tampoco está definida
        console.log('updateConverterUI: Monto inválido o cero. No se realizó llamada a API.'); // <--- DEBUG LOG
        return;
    }

    console.log(`updateConverterUI: Llamando a updateEstimatedRate para ${currentFromCurrency} a ${currentToCurrency}`); // <--- DEBUG LOG
    // AÑADIR: La función updateEstimatedRate NO EXISTE en el código que me has dado.
    // Necesitas definirla, o si su propósito era solo obtener la tasa, llamar directamente a getConversionRate.
    // Esto causará un ReferenceError si no la defines.
    const conversionRate = await getConversionRate(currentFromCurrency, currentToCurrency); // <-- Corregido aquí
    currentConversionRate = conversionRate; // Actualiza la variable global

    if (conversionRate === null || conversionRate === 0) {
        resultDisplay.textContent = "No se pudo calcular la conversión.";
        return;
    }

    const result = amount * conversionRate;
    const formattedResult = (fiatCurrencies.includes(currentToCurrency)) ? formatCurrencyUSD(result) : formatCrypto(result);
    resultDisplay.textContent = `${formattedResult} ${currentToCurrency}`;

    // AÑADIR: La función createChart NO EXISTE en el código que me has dado.
    // Si la necesitas para el gráfico, debes implementarla.
    const newData = await getHistoricalData(currentFromCurrency, currentToCurrency);
    if (newData.length > 0) {
        // createChart(newData, currentFromCurrency, currentToCurrency); // Debe ser implementada
    } else {
        // createChart([], currentFromCurrency, currentToCurrency); // Debe ser implementada
        console.warn("No hay datos históricos disponibles para el par seleccionado.");
    }
    
    // Si necesitas mostrar la tasa estimada, puedes hacerlo aquí
    if (estimatedRateDisplay) {
        estimatedRateDisplay.textContent = `Tasa Estimada: 1 ${currentFromCurrency} ~ ${conversionRate ? conversionRate.toFixed(8) : 'N/A'} ${currentToCurrency}`;
    }
}

async function inicializarConverter() {
    console.log('inicializarConverter: Iniciando...'); // <--- DEBUG LOG
    if (!fromCurrencySelect || !toCurrencySelect || !amountInput || !convertButton || !switchButton) {
        console.warn("Elementos esenciales del conversor no encontrados en el DOM. Saltando inicialización del conversor.");
        if (amountInput) amountInput.disabled = true;
        if (fromCurrencySelect) fromCurrencySelect.disabled = true;
        if (toCurrencySelect) toCurrencySelect.disabled = true;
        if (convertButton) convertButton.disabled = true;
        if (switchButton) switchButton.disabled = true;
        if (estimatedRateDisplay) estimatedRateDisplay.textContent = "Conversor no disponible. Elementos HTML faltantes.";
        if (resultDisplay) resultDisplay.textContent = "";
        return;
    }

    populateCurrencySelects();
    console.log('inicializarConverter: populateCurrencySelects ejecutado.'); // <--- DEBUG LOG

    fromCurrencySelect.value = currentFromCurrency;
    toCurrencySelect.value = currentToCurrency;

    fromCurrencySelect.addEventListener('change', updateConverterUI);
    toCurrencySelect.addEventListener('change', updateConverterUI);
    amountInput.addEventListener('input', updateConverterUI);

    convertButton.addEventListener("click", updateConverterUI);
    switchButton.addEventListener("click", switchCurrencies);
    console.log('inicializarConverter: Event Listeners registrados.'); // <--- DEBUG LOG

    await updateConverterUI();
    console.log('inicializarConverter: updateConverterUI inicial ejecutado.'); // <--- DEBUG LOG
}

function populateCurrencySelects() {
    fromCurrencySelect.innerHTML = "";
    toCurrencySelect.innerHTML = "";

    cryptoCurrencies.forEach(currency => {
        const option = document.createElement("option");
        option.value = currency;
        option.textContent = currency;
        fromCurrencySelect.appendChild(option);
    });
    fiatCurrencies.forEach(currency => {
        const option = document.createElement("option");
        option.value = currency;
        option.textContent = currency;
        toCurrencySelect.appendChild(option);
    });
}

async function switchCurrencies() {
    if (!fromCurrencySelect || !toCurrencySelect) {
        console.error("Elementos selectores de moneda no encontrados.");
        return;
    }

    const tempFromCurrency = fromCurrencySelect.value;
    const tempToCurrency = toCurrencySelect.value;

    fromCurrencySelect.value = tempToCurrency;
    toCurrencySelect.value = tempFromCurrency;

    // Estas dos líneas son redundantes, ya se hizo arriba
    // fromCurrencySelect.value = tempToCurrency;
    // toCurrencySelect.value = tempFromCurrency;

    await updateConverterUI();
}

function formatCurrencyUSD(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatCrypto(value) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
    }).format(value);
}

// POSIBLES FUNCIONES FALTANTES QUE CAUSARÍAN ERRORES DE REFERENCIA:
// function simulateTimerCircle() { ... }
// function createChart(data, from, to) { ... }