<script setup>
import { useTheme } from 'vuetify'
import ScrollToTop from '@core/components/ScrollToTop.vue'
import initCore from '@core/initCore'
import { initConfigStore, useConfigStore } from '@core/stores/config'
import { hexToRgb } from '@core/utils/colorConverter'
import Swal from 'sweetalert2'

// import { usePermissions } from '@/composables/usePermissions'
import { useUiPermissions } from '@/composables/useUiPermissions'
import { useAuth } from '@/composables/useAuth'
import { useInactivityLogout } from './composables/useInactivityLogout'
import api from '@/axios'

// const { loadPermissionsFromStorage, clearPermissions } = usePermissions()

const { fetchUiPermissions, clearUiPermissions } = useUiPermissions()
const { fetchSession } = useAuth()
const { start, stop } = useInactivityLogout()


const router = useRouter()
const { global } = useTheme()
initCore()
initConfigStore()
const configStore = useConfigStore()

onMounted(async () => {
  await fetchSession()
  await fetchUiPermissions()
})

// Arrancar / detener según ruta
router.afterEach((to) => {
  const excludedRoutes = ['/login', '/404']
  excludedRoutes.includes(to.path) ? stop() : start()
})
</script>

<template>
  <VLocaleProvider :rtl="configStore.isAppRTL">
    <VApp :style="`--v-global-theme-primary: ${hexToRgb(global.current.value.colors.primary)}`">
      <RouterView />
      <ScrollToTop />
    </VApp>
  </VLocaleProvider>
</template>