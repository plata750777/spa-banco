// Firebase ya está cargado desde los scripts en el HTML
const firebase = window.firebase

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
let currentEditingUserId = null
let allUsers = []

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  checkAdminAuth()
  setupEventListeners()
})

// Verificar autenticación de administrador
function checkAdminAuth() {
  const admin = JSON.parse(sessionStorage.getItem("loggedInUser"))

  if (!admin || !admin.isAdmin) {
    window.location.href = "index.html"
    return
  }

  document.getElementById("adminName").textContent = admin.info?.nombre || "Administrador"
  loadUsers()
}

// Configurar event listeners
function setupEventListeners() {
  document.getElementById("logoutBtn").addEventListener("click", logout)
  document.getElementById("userForm").addEventListener("submit", handleUserSubmit)
  document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete)

  // Cerrar modales al hacer clic fuera
  window.addEventListener("click", (event) => {
    const modals = document.getElementsByClassName("modal")
    for (const modal of modals) {
      if (event.target === modal) {
        modal.style.display = "none"
      }
    }
  })
}

// Cargar todos los usuarios desde Firestore
async function loadUsers() {
  try {
    const usersSnapshot = await db.collection("users").get()
    allUsers = []

    usersSnapshot.forEach((doc) => {
      allUsers.push({
        id: doc.id,
        ...doc.data(),
      })
    })

    renderUsersTable(allUsers)
    updateStats(allUsers)
  } catch (error) {
    console.error("[v0] Error al cargar usuarios:", error)
    alert("Error al cargar usuarios: " + error.message)
  }
}

// Renderizar tabla de usuarios
function renderUsersTable(users) {
  const tbody = document.getElementById("usersTableBody")

  if (users.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align: center; padding: 2rem;">No hay usuarios registrados</td></tr>'
    return
  }

  tbody.innerHTML = users
    .map(
      (user) => `
        <tr>
            <td>${user.nombre || "N/A"}</td>
            <td>${user.correo || "N/A"}</td>
            <td>${user.cuenta || "N/A"}</td>
            <td>$${(user.saldoAhorros || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            <td>$${(user.saldoCorriente || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            <td>
                <span class="status-badge ${user.estado === "activa" ? "status-active" : "status-frozen"}">
                    ${user.estado === "activa" ? "Activa" : "Congelada"}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="openEditModal('${user.id}')">✏️ Editar</button>
                    <button class="delete-btn-table" onclick="openDeleteModal('${user.id}')">🗑️ Eliminar</button>
                </div>
            </td>
        </tr>
    `,
    )
    .join("")
}

// Actualizar estadísticas
function updateStats(users) {
  const totalUsers = users.length
  const totalBalance = users.reduce((sum, user) => sum + (user.saldoAhorros || 0) + (user.saldoCorriente || 0), 0)
  const frozenAccounts = users.filter((user) => user.estado === "congelada").length

  document.getElementById("totalUsers").textContent = totalUsers
  document.getElementById("totalBalance").textContent =
    "$" + totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })
  document.getElementById("frozenAccounts").textContent = frozenAccounts
}

// Buscar usuarios
function searchUsers() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim()

  if (!searchTerm) {
    renderUsersTable(allUsers)
    return
  }

  const filteredUsers = allUsers.filter(
    (user) =>
      (user.nombre || "").toLowerCase().includes(searchTerm) ||
      (user.correo || "").toLowerCase().includes(searchTerm) ||
      (user.cuenta || "").toLowerCase().includes(searchTerm),
  )

  renderUsersTable(filteredUsers)
}

// Abrir modal de crear usuario
function openCreateModal() {
  currentEditingUserId = null
  document.getElementById("modalTitle").textContent = "Crear Usuario"
  document.getElementById("submitBtn").textContent = "Crear Usuario"
  document.getElementById("userForm").reset()
  document.getElementById("passwordGroup").style.display = "block"
  document.getElementById("userPassword").required = true
  document.getElementById("userModal").style.display = "block"
}

// Abrir modal de editar usuario
async function openEditModal(userId) {
  currentEditingUserId = userId
  document.getElementById("modalTitle").textContent = "Editar Usuario"
  document.getElementById("submitBtn").textContent = "Guardar Cambios"
  document.getElementById("passwordGroup").style.display = "none"
  document.getElementById("userPassword").required = false

  try {
    const userDoc = await db.collection("users").doc(userId).get()
    const userData = userDoc.data()

    // Llenar formulario con datos del usuario
    document.getElementById("userEmail").value = userData.correo || ""
    document.getElementById("userName").value = userData.nombre || ""
    document.getElementById("userDireccion").value = userData.direccion || ""
    document.getElementById("userResidencia").value = userData.residencia || ""
    document.getElementById("userEstadoCivil").value = userData.estadoCivil || ""
    document.getElementById("userPersonasCargo").value = userData.personasCargo || ""
    document.getElementById("userCuenta").value = userData.cuenta || ""
    document.getElementById("userTipoCuenta").value = userData.tipoCuenta || "Ahorros"
    document.getElementById("userFechaApertura").value = userData.fechaApertura || ""
    document.getElementById("userTasaInteres").value = userData.tasaInteres || ""
    document.getElementById("userEstado").value = userData.estado || "activa"
    document.getElementById("userSaldoAhorros").value = userData.saldoAhorros || 0
    document.getElementById("userSaldoCorriente").value = userData.saldoCorriente || 0
    document.getElementById("userSaldoTarjeta").value = userData.saldoTarjeta || 0
    document.getElementById("userTrabajo").value = userData.trabajo || ""
    document.getElementById("userSalario").value = userData.salario || ""
    document.getElementById("userGastos").value = userData.gastos || ""
    document.getElementById("userDeudas").value = userData.deudas || ""
    document.getElementById("userInversiones").value = userData.inversiones || ""
    document.getElementById("userConsignaciones").value = userData.consignaciones || 0
    document.getElementById("userCreditos").value = userData.creditos || 0
    document.getElementById("userPagos").value = userData.pagos || 0

    document.getElementById("userModal").style.display = "block"
  } catch (error) {
    console.error("[v0] Error al cargar usuario:", error)
    alert("Error al cargar datos del usuario: " + error.message)
  }
}

// Cerrar modal de usuario
function closeUserModal() {
  document.getElementById("userModal").style.display = "none"
  document.getElementById("userForm").reset()
  currentEditingUserId = null
}

// Manejar envío del formulario
async function handleUserSubmit(event) {
  event.preventDefault()

  const submitBtn = document.getElementById("submitBtn")
  const originalText = submitBtn.textContent
  submitBtn.disabled = true
  submitBtn.innerHTML = '<span class="loading"></span> Procesando...'

  try {
    const userData = {
      correo: document.getElementById("userEmail").value,
      nombre: document.getElementById("userName").value,
      direccion: document.getElementById("userDireccion").value,
      residencia: document.getElementById("userResidencia").value,
      estadoCivil: document.getElementById("userEstadoCivil").value,
      personasCargo: document.getElementById("userPersonasCargo").value,
      cuenta: document.getElementById("userCuenta").value,
      tipoCuenta: document.getElementById("userTipoCuenta").value,
      fechaApertura: document.getElementById("userFechaApertura").value,
      tasaInteres: Number.parseFloat(document.getElementById("userTasaInteres").value) || 0,
      estado: document.getElementById("userEstado").value,
      saldoAhorros: Number.parseFloat(document.getElementById("userSaldoAhorros").value) || 0,
      saldoCorriente: Number.parseFloat(document.getElementById("userSaldoCorriente").value) || 0,
      saldoTarjeta: Number.parseFloat(document.getElementById("userSaldoTarjeta").value) || 0,
      trabajo: document.getElementById("userTrabajo").value,
      salario: Number.parseFloat(document.getElementById("userSalario").value) || 0,
      gastos: Number.parseFloat(document.getElementById("userGastos").value) || 0,
      deudas: Number.parseFloat(document.getElementById("userDeudas").value) || 0,
      inversiones: Number.parseFloat(document.getElementById("userInversiones").value) || 0,
      consignaciones: Number.parseFloat(document.getElementById("userConsignaciones").value) || 0,
      creditos: Number.parseFloat(document.getElementById("userCreditos").value) || 0,
      pagos: Number.parseFloat(document.getElementById("userPagos").value) || 0,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }

    if (currentEditingUserId) {
      // Actualizar usuario existente
      await db.collection("users").doc(currentEditingUserId).update(userData)
      alert("Usuario actualizado exitosamente")
    } else {
      // Crear nuevo usuario
      const password = document.getElementById("userPassword").value

      // Crear usuario en Firebase Auth
      const userCredential = await auth.createUserWithEmailAndPassword(userData.correo, password)

      // Guardar datos en Firestore
      userData.createdAt = firebase.firestore.FieldValue.serverTimestamp()
      await db.collection("users").doc(userCredential.user.uid).set(userData)

      alert("Usuario creado exitosamente")
    }

    closeUserModal()
    loadUsers()
  } catch (error) {
    console.error("[v0] Error al guardar usuario:", error)
    alert("Error al guardar usuario: " + error.message)
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = originalText
  }
}

// Abrir modal de confirmación de eliminación
function openDeleteModal(userId) {
  currentEditingUserId = userId
  document.getElementById("deleteModal").style.display = "block"
}

// Cerrar modal de eliminación
function closeDeleteModal() {
  document.getElementById("deleteModal").style.display = "none"
  currentEditingUserId = null
}

// Confirmar eliminación
async function confirmDelete() {
  if (!currentEditingUserId) return

  const confirmBtn = document.getElementById("confirmDeleteBtn")
  confirmBtn.disabled = true
  confirmBtn.innerHTML = '<span class="loading"></span> Eliminando...'

  try {
    // Eliminar de Firestore
    await db.collection("users").doc(currentEditingUserId).delete()

    // Nota: Para eliminar el usuario de Firebase Auth, necesitarías usar Firebase Admin SDK
    // desde el backend, ya que no se puede hacer directamente desde el cliente

    alert("Usuario eliminado exitosamente de la base de datos")
    closeDeleteModal()
    loadUsers()
  } catch (error) {
    console.error("[v0] Error al eliminar usuario:", error)
    alert("Error al eliminar usuario: " + error.message)
  } finally {
    confirmBtn.disabled = false
    confirmBtn.textContent = "Eliminar"
  }
}

// Cerrar sesión
function logout() {
  auth
    .signOut()
    .then(() => {
      sessionStorage.removeItem("loggedInUser")
      window.location.href = "index.html"
    })
    .catch((error) => {
      console.error("[v0] Error al cerrar sesión:", error)
      sessionStorage.removeItem("loggedInUser")
      window.location.href = "index.html"
    })
}
