
// ✅ Supabase ya está cargado desde el HTML
const supabase = window.supabase.createClient(
  'https://dufhqzqyhjronnrzaira.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZmhxenF5aGpyb25ucnphaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjY5ODYsImV4cCI6MjA3NzAwMjk4Nn0.q1rfdDkg2_5I0o_kpBIxKF1V2bpJlcJKDG54-zqu158'
);

// 🔐 Variables globales
let allUsers = [];
let currentEditingUserId = null;

document.addEventListener('DOMContentLoaded', () => {
  const session = JSON.parse(sessionStorage.getItem('loggedInUser'));
  if (!session || !session.isAdmin) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('adminName').textContent = session.info.nombre || 'Administrador';

  loadUsers();
  setupEventListeners();

  document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);
});

function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    logout({ auto: false, redirect: 'index.html' });
  });

  document.getElementById('searchBtn').addEventListener('click', searchUsers);
  document.getElementById('createBtn').addEventListener('click', openCreateModal);
}

async function loadUsers() {
  const { data, error } = await supabase.from('users').select('*');
  if (error) {
    alert('Error al cargar usuarios: ' + error.message);
    return;
  }
  allUsers = data;
  renderUsersTable(allUsers);
  updateStats(allUsers);
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No hay usuarios registrados</td></tr>';
    return;
  }

  tbody.innerHTML = users.map((u) => `
    <tr>
      <td>${u.nombre || 'N/A'}</td>
      <td>${u.correo || 'N/A'}</td>
      <td>${u.cuenta || 'N/A'}</td>
      <td>$${(u.saldoAhorros || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td>$${(u.saldoCorriente || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      <td>
        <span class="status-badge ${u.estado === 'activa' ? 'status-active' : 'status-frozen'}">
          ${u.estado === 'activa' ? 'Activa' : 'Congelada'}
        </span>
      </td>
      <td>
        <button onclick="openEditModal('${u.id}')">✏️ Editar</button>
        <button onclick="openDeleteModal('${u.id}')">🗑️ Eliminar</button>
      </td>
    </tr>
  `).join('');
}

function updateStats(users) {
  const totalUsers = users.length;
  const totalBalance = users.reduce((sum, u) => sum + (u.saldoAhorros || 0) + (u.saldoCorriente || 0), 0);
  const frozenAccounts = users.filter((u) => u.estado === 'congelada').length;

  document.getElementById('totalUsers').textContent = totalUsers;
  document.getElementById('totalBalance').textContent = '$' + totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 });
  document.getElementById('frozenAccounts').textContent = frozenAccounts;
}

async function openEditModal(userId) {
  currentEditingUserId = userId;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    alert('Error al cargar usuario');
    return;
  }

  // Mostrar saldo total si el campo existe
  const saldoTotalEl = document.getElementById('userSaldoTotal');
  if (saldoTotalEl) {
    const total = (data.saldoAhorros || 0) + (data.saldoCorriente || 0);
    saldoTotalEl.value = total.toFixed(2);
  }

  // Cargar todos los campos que existan en el DOM
  Object.keys(data).forEach((key) => {
    const input = document.getElementById(`user${capitalize(key)}`);
    if (input) {
      if (input.type === 'number') {
        input.value = parseFloat(data[key]) || 0;
      } else if (input.type === 'date' && data[key]) {
        input.value = new Date(data[key]).toISOString().split('T')[0];
      } else {
        input.value = data[key] ?? '';
      }
    }
  });

  // Ocultar campo de contraseña al editar
  const passwordGroup = document.getElementById('passwordGroup');
  if (passwordGroup) passwordGroup.style.display = 'none';

  // Ajustar encabezado y botón
  document.getElementById('modalTitle').textContent = 'Editar Usuario';
  document.getElementById('submitBtn').textContent = 'Guardar Cambios';

  // Mostrar modal
  document.getElementById('userModal').style.display = 'block';
  
  actualizarGraficoMovimientos();

}


function openCreateModal() {
  currentEditingUserId = null;

  // Ajustar encabezado y botón
  document.getElementById('modalTitle').textContent = 'Crear Usuario';
  document.getElementById('submitBtn').textContent = 'Crear Usuario';

  // Mostrar campo de contraseña
  const passwordGroup = document.getElementById('passwordGroup');
  if (passwordGroup) passwordGroup.style.display = 'block';

  // Limpiar todos los campos del formulario
  document.querySelectorAll('#userForm input, #userForm select').forEach(el => {
    if (el.type === 'number') {
      el.value = 0;
    } else if (el.type === 'date') {
      el.value = '';
    } else {
      el.value = '';
    }
  });
const passwordInput = document.getElementById('userPassword');
if (passwordInput) passwordInput.value = '';

  // Mostrar modal
  document.getElementById('userModal').style.display = 'block';
}


function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
}

function searchUsers() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allUsers.filter(u =>
    (u.nombre || '').toLowerCase().includes(query) ||
    (u.correo || '').toLowerCase().includes(query) ||
    (u.cuenta || '').toLowerCase().includes(query)
  );
  renderUsersTable(filtered);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function handleUserSubmit(e) {
  e.preventDefault();

  const userData = {};
  const fields = [
    'correo','nombre','cuenta','estado','saldoAhorros','saldoCorriente','saldoTarjeta',
    'trabajo','salario','gastos','deudas','inversiones','consignaciones','creditos','pagos',
    'direccion','residencia','estadoCivil','personasCargo',
    'tipoCuenta','fechaApertura','tasaInteres'
  ];

  // Captura todos los campos del formulario
  fields.forEach((f) => {
    const el = document.getElementById(`user${capitalize(f)}`);
    if (!el) return;
    const valor = el.type === 'number' ? parseFloat(el.value) : el.value;
    if (valor !== '' && valor !== null && !isNaN(valor)) {
      userData[f] = el.type === 'number' ? valor : valor.trim();
    }
  });

  // Si existe campo de saldo total, lo usamos
  const saldoTotalEl = document.getElementById('userSaldoTotal');
  if (saldoTotalEl && saldoTotalEl.value !== '') {
    const saldoTotal = parseFloat(saldoTotalEl.value);
    if (!isNaN(saldoTotal)) {
      userData.saldoAhorros = saldoTotal / 2;
      userData.saldoCorriente = saldoTotal / 2;
    }
  }

  if (currentEditingUserId) {
    // Solo actualiza campos con valor
    const camposActualizados = {};
    for (const key in userData) {
      if (userData[key] !== '' && userData[key] !== null && userData[key] !== undefined) {
        camposActualizados[key] = userData[key];
      }
    }

    const { error } = await supabase.from('users').update(camposActualizados).eq('id', currentEditingUserId);
    if (error) alert('Error al actualizar: ' + error.message);
    else alert('Usuario actualizado');
  } else {
  
    // ✅ Solo validamos correo y contraseña
    const passwordInput = document.getElementById('userPassword');
    const password = passwordInput?.value?.trim();

    if (!userData.correo?.trim() || !password) {
    alert('Debes ingresar al menos correo y contraseña');
    return;
}


    // ✅ Valores por defecto si no se ingresan
    userData.nombre = userData.nombre || 'Sin nombre';
    userData.cuenta = userData.cuenta || '00000000';

    const { data: authUser, error: authError } = await supabase.auth.signUp({ email: userData.correo, password });
    if (authError || !authUser?.user?.id) {
      alert('Error al crear usuario: ' + authError.message);
      return;
    }

    userData.id = authUser.user.id;
    const { error: insertError } = await supabase.from('users').insert(userData);
    if (insertError) alert('Error al guardar datos: ' + insertError.message);
    else alert('Usuario creado exitosamente');
  }

  closeUserModal();
  loadUsers();
}



async function confirmDelete() {
  if (!currentEditingUserId) return;
  const { error } = await supabase.from('users').delete().eq('id', currentEditingUserId);
  if (error) alert('Error al eliminar: ' + error.message);
  else {
    alert('Usuario eliminado');
    closeDeleteModal();
    loadUsers();
  }
}

function logout({ auto = false, redirect = 'index.html' } = {}) {
  sessionStorage.removeItem('loggedInUser');
  supabase.auth.signOut().catch(err => console.warn('Error al cerrar sesión Supabase:', err));
  if (auto) alert('Sesión expirada por inactividad.');
  window.location.href = redirect;
}
