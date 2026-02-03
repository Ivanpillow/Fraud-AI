<script setup>
import UserBioPanel from '@/views/apps/user/view/UserBioPanel.vue'
import UserTabAccount from '@/views/apps/user/view/UserTabAccount.vue'
import UserTabBillingsPlans from '@/views/apps/user/view/UserTabBillingsPlans.vue'
import UserTabConnections from '@/views/apps/user/view/UserTabConnections.vue'
import UserTabNotifications from '@/views/apps/user/view/UserTabNotifications.vue'
import UserTabSecurity from '@/views/apps/user/view/UserTabSecurity.vue'
import { useAuth } from '@/composables/useAuth'

import api from '@/services/api'

const { user } = useAuth()

// // Leer cookie
// const userDataCookie = useCookie('userData')

// // Si no existe la cookie, podemos prevenir errores
// if (!userDataCookie.value) {
//   console.error("No se encontró cookie userData")
// }


const perfil = ref(null)
const errors = ref(null)
const userTab = ref(null)


const tabs = [
  {
    icon: 'tabler-users',
    title: 'Account',
  },
  {
    icon: 'tabler-lock',
    title: 'Security',
  },
  {
    icon: 'tabler-bookmark',
    title: 'Billing & Plan',
  },
  {
    icon: 'tabler-bell',
    title: 'Notifications',
  },
  {
    icon: 'tabler-link',
    title: 'Connections',
  },
]

// Cargar datos del usuario cuando se monta el componente
onMounted(async () => {
  try {
    if (!user.value?.id) {
      throw new Error('Usuario no autenticado')
    }

    const { data } = await api.get('/perfil/me')
    perfil.value = data.userData
  } catch (err) {
    console.error('Error obteniendo perfil:', err)
    errors.value = err.message || 'Error desconocido'
  }
})

// const { data: userData } = await useApi(`/apps/users/${ route.params.id }`)
</script>

<template>
  <VRow v-if="perfil">
    <VCol
      cols="12"
       md="12" 
       lg="12" 
    >
      <UserBioPanel :user-data="perfil" />
    </VCol>

    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <!-- <VTabs
        v-model="userTab"
        class="v-tabs-pill"
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.icon"
        >
          <VIcon
            :size="18"
            :icon="tab.icon"
            class="me-1"
          />
          <span>{{ tab.title }}</span>
        </VTab>
      </VTabs> -->

      <!-- <VWindow
        v-model="userTab"
        class="mt-6 disable-tab-transition"
        :touch="false"
      >
        <VWindowItem>
          <UserTabAccount />
        </VWindowItem>

        <VWindowItem>
          <UserTabSecurity />
        </VWindowItem>

        <VWindowItem>
          <UserTabBillingsPlans />
        </VWindowItem>

        <VWindowItem>
          <UserTabNotifications />
        </VWindowItem>

        <VWindowItem>
          <UserTabConnections />
        </VWindowItem>
      </VWindow> -->
    </VCol>
  </VRow>
  <!-- <div v-else>
    <VAlert
      type="error"
      variant="tonal"
    >
      ¡Usuario no encontrado!
    </VAlert>
  </div> -->
</template>
