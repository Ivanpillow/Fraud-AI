import { ref } from 'vue'

const userPermissions = ref([])
const userRole = ref(null) 

function loadPermissionsFromStorage() {
  const storedPermissions = localStorage.getItem('userPermissions')
  const storedRole = localStorage.getItem('userRole')

  userPermissions.value = storedPermissions ? JSON.parse(storedPermissions) : []
  userRole.value = storedRole
}

function setPermissionsAndRole(perms, roleId) {
  userPermissions.value = perms || []
  userRole.value = roleId || null 

  localStorage.setItem('userPermissions', JSON.stringify(userPermissions.value))
  localStorage.setItem('userRole', userRole.value) 
}

function clearPermissions() {
  userPermissions.value = []
  userRole.value = null
  localStorage.removeItem('userPermissions')
  localStorage.removeItem('userRole')
}

function hasPermission(permisoId) {
  return userPermissions.value.includes(permisoId)
}

function hasRole(roleId) {
  return userRole.value === roleId
}

function getUserRole() {
    return userRole.value
}

export function usePermissions() {
  return { userPermissions, loadPermissionsFromStorage, setPermissionsAndRole, clearPermissions, hasPermission, hasRole, getUserRole }
}