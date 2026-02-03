import Swal from 'sweetalert2'
import api from '@/axios'
import { useRouter } from 'vue-router'

export function useInactivityLogout() {
  const router = useRouter()
  const { logout: frontendLogout } = useAuth()

  // ================= CONFIGURACIÓN =================
  const INACTIVITY_LIMIT = 10 * 60 * 1000   // 10 minutos
  const WARNING_TIME = 30 * 1000             // 30 segundos
  const THROTTLE_TIME = 5000                 // 5 segundos

  // ================= ESTADO =================
  let inactivityTimer = null
  let logoutTimer = null
  let lastActivity = Date.now()

  // Eventos mínimos y eficientes
  const activityEvents = ['mousedown', 'keydown', 'touchstart']
  const listenerOptions = { passive: true }

  // ================= CONTROL =================
  function start() {
    stop() // evitar duplicados
    activityEvents.forEach(evt =>
      window.addEventListener(evt, onActivity, listenerOptions)
    )
    scheduleTimers()
  }

  function stop() {
    activityEvents.forEach(evt =>
      window.removeEventListener(evt, onActivity, listenerOptions)
    )
    clearTimers()
  }

  function onActivity() {
    const now = Date.now()
    if (now - lastActivity < THROTTLE_TIME) return
    lastActivity = now

    clearTimers()
    scheduleTimers()
  }

  function clearTimers() {
    if (inactivityTimer) clearTimeout(inactivityTimer)
    if (logoutTimer) clearTimeout(logoutTimer)
  }

  function scheduleTimers() {
    inactivityTimer = setTimeout(
      showWarning,
      INACTIVITY_LIMIT - WARNING_TIME
    )
  }

  // ================= UI =================
  function showWarning() {
    Swal.fire({
      title: '¿Sigues ahí?',
      text: 'Tu sesión se cerrará pronto por inactividad.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Seguir conectado',
      cancelButtonText: 'Cerrar sesión',
      allowOutsideClick: false,
      buttonsStyling: false,
      customClass: {
        confirmButton: 'px-4 py-2 rounded-md mx-2 text-white',
        cancelButton: 'px-4 py-2 rounded-md mx-2 text-white',
      },
      didRender: () => {
        const confirmBtn = document.querySelector('.swal2-confirm')
        const cancelBtn = document.querySelector('.swal2-cancel')
        if (confirmBtn) confirmBtn.style.backgroundColor = '#7367F0'
        if (cancelBtn) cancelBtn.style.backgroundColor = '#EA5455'
      }
    }).then(result => {
      if (result.isConfirmed) {
        onActivity()
      } else {
        logout()
      }
    })

    logoutTimer = setTimeout(logout, WARNING_TIME)
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch (_) {
      // incluso si falla el backend, se fuerza logout
    } finally {
      stop()
      Swal.close()
      frontendLogout()           // 🔥 CLAVE
      await router.replace('/login') // 🔥 replace, no push
    }
  }

  return { start, stop }
}
