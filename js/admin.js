// Supabase config (si la tienes aquí)
const SUPABASE_URL = 'https://dufhqzqyhjronnrzaira.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1ZmhxenF5aGpyb25ucnphaXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjY5ODYsImV4cCI6MjA3NzAwMjk4Nn0.q1rfdDkg2_5I0o_kpBIxKF1V2bpJlcJKDG54-zqu158';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 🔐 Variables globales
let allUsers = [];
let currentEditingUserId = null;

document.addEventListener('DOMContentLoaded', () => {
  const session = JSON.parse(sessionStorage.getItem('loggedInUser'))
  if (!session || !session.isAdmin) {
    window.location.href = 'index.html'
    return
  }
  document.getElementById('adminName').textContent = session.info.nombre || 'Administrador'
  loadUsers()
  setupEventListeners()
  document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
  document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDelete);

})
async function loadUsers() {
  const { data, error } = await supabase.from('users').select('*')
  if (error) {
    alert('Error al cargar usuarios: ' + error.message)
    return
  }
  allUsers = data
  renderUsersTable(allUsers)
  updateStats(allUsers)
}
function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody')
  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7">No hay usuarios registrados</td></tr>'
    return
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
  `).join('')
}
function updateStats(users) {
  const totalUsers = users.length
  const totalBalance = users.reduce((sum, u) => sum + (u.saldoAhorros || 0) + (u.saldoCorriente || 0), 0)
  const frozenAccounts = users.filter((u) => u.estado === 'congelada').length

  document.getElementById('totalUsers').textContent = totalUsers
  document.getElementById('totalBalance').textContent = '$' + totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })
  document.getElementById('frozenAccounts').textContent = frozenAccounts
}
async function openEditModal(userId) {
  currentEditingUserId = userId;
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
  if (error || !data) {
    alert('Error al cargar usuario');
    return;
  }

  for (const key in data) {
    const input = document.getElementById(`user${capitalize(key)}`);
    if (input) input.value = data[key];
  }

  document.getElementById('passwordGroup').style.display = 'none';
  document.getElementById('modalTitle').textContent = 'Editar Usuario';
  document.getElementById('submitBtn').textContent = 'Guardar Cambios';
  document.getElementById('userModal').style.display = 'block';
}

async function handleUserSubmit(e) {
  e.preventDefault()
  const userData = {}
  const fields = ['correo','nombre','cuenta','estado','saldoAhorros','saldoCorriente','saldoTarjeta','trabajo','salario','gastos','deudas','inversiones','consignaciones','creditos','pagos']

  fields.forEach((f) => {
    const el = document.getElementById(`user${capitalize(f)}`)
    userData[f] = el?.type === 'number' ? parseFloat(el.value) || 0 : el?.value || ''
  })

  if (currentEditingUserId) {
    const { error } = await supabase.from('users').update(userData).eq('id', currentEditingUserId)
    if (error) alert('Error al actualizar: ' + error.message)
    else alert('Usuario actualizado')
  } else {
  const password = document.getElementById('userPassword').value;

  if (!userData.correo || !password || !userData.nombre || !userData.cuenta) {
    alert('Por favor completa los campos obligatorios');
    return;
  }
    const { data: authUser, error: authError } = await supabase.auth.signUp({ email: userData.correo, password })
    if (authError || !authUser?.user?.id) {
      alert('Error al crear usuario: ' + authError.message)
      return
    }
    userData.id = authUser.user.id
    const { error: insertError } = await supabase.from('users').insert(userData)
    if (insertError) alert('Error al guardar datos: ' + insertError.message)
    else alert('Usuario creado exitosamente')
  }

  closeUserModal()
  loadUsers()
}
async function confirmDelete() {
  if (!currentEditingUserId) return
  const { error } = await supabase.from('users').delete().eq('id', currentEditingUserId)
  if (error) alert('Error al eliminar: ' + error.message)
  else {
    alert('Usuario eliminado')
    closeDeleteModal()
    loadUsers()
  }
}
function openCreateModal() {
  currentEditingUserId = null;
  document.getElementById('modalTitle').textContent = 'Crear Usuario';
  document.getElementById('submitBtn').textContent = 'Crear Usuario';
  document.getElementById('passwordGroup').style.display = 'block';
  document.getElementById('userModal').style.display = 'block';

  // Limpiar todos los campos
  document.querySelectorAll('#userForm input, #userForm select').forEach(el => {
    el.value = el.type === 'number' ? 0 : '';
  });
}
function closeUserModal() {
  document.getElementById('userModal').style.display = 'none';
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
function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', () => {
    logout({ auto: false, redirect: 'index.html' });
  });

  document.getElementById('searchBtn').addEventListener('click', searchUsers);
  document.getElementById('createBtn').addEventListener('click', openCreateModal);
}


