document.addEventListener('DOMContentLoaded', () => {
  const session = JSON.parse(sessionStorage.getItem('loggedInUser'))
  if (!session || !session.isAdmin) {
    window.location.href = 'index.html'
    return
  }
  document.getElementById('adminName').textContent = session.info.nombre || 'Administrador'
  loadUsers()
  setupEventListeners()
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
  currentEditingUserId = userId
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).single()
  if (error || !data) {
    alert('Error al cargar usuario')
    return
  }

  for (const key in data) {
    const input = document.getElementById(`user${capitalize(key)}`)
    if (input) input.value = data[key]
  }

  document.getElementById('modalTitle').textContent = 'Editar Usuario'
  document.getElementById('submitBtn').textContent = 'Guardar Cambios'
  document.getElementById('userModal').style.display = 'block'
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
    const password = document.getElementById('userPassword').value
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
