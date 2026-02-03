import { ref } from 'vue'
import api from '@/axios'

const permissions = ref([])
const role = ref(null)
const loaded = ref(false)

export async function fetchUiPermissions() {
  if (loaded.value) return

  try {
    const res = await api.get('/auth/ui-permissions')

    permissions.value = res.data.permissions || []
    role.value = res.data.role || null
    loaded.value = true
  } catch (err) {
    if (err.response?.status === 401) {
      // Sesión no válida o no autenticado
      permissions.value = []
      role.value = null
      loaded.value = false
    } else {
      throw err // otros errores sí deben explotar
    }
  }
}

export function hasPermission(permissionId) {
  return permissions.value.includes(permissionId)
}

export function hasRole(roleId) {
  return role.value === roleId
}

export function getUserRole() {
  return role.value
}

export function clearUiPermissions() {
  permissions.value = []
  role.value = null
  loaded.value = false
}

export function useUiPermissions() {
  return {
    permissions,
    role,
    fetchUiPermissions,
    hasPermission,
    hasRole,
    getUserRole,
    clearUiPermissions,
  }
}