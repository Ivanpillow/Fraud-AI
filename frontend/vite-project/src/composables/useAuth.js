import { ref } from 'vue'
import api from '@/axios'
import { useCookie } from '@/@core/composable/useCookie'
import { ability } from '@/plugins/casl'  
import { clearUiPermissions } from './useUiPermissions'

const user = ref(null)
const loading = ref(false)

const userAbilityRules = useCookie('userAbilityRules', { path: '/' })
const userDataCookie = useCookie('userData', { path: '/' })

export async function login(credentials) {
  loading.value = true
  try {
    await api.post('/auth/login', credentials)
    
  } finally {
    loading.value = false
  }
}

export function logout() {
  clearUiPermissions
  user.value = null
  userAbilityRules.value = null
  userDataCookie.value = null

  // limpiar CASL
  ability.update([])
}

export async function fetchSession() {
  loading.value = true
  try {
    const res = await api.get('/auth/me')

    user.value = res.data.userData
    ability.update(res.data.userAbilityRules)
  } catch {
    user.value = null
    ability.update([])
  } finally {
    loading.value = false
  }
}

export function useAuth() {
  return { user, loading, login, logout, fetchSession }
}


