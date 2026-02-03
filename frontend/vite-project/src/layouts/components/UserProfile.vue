<script setup>
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useAuth } from '@/composables/useAuth'

import api from '@/axios'

const router = useRouter()
const { user } = useAuth()

const handleLogout = async () => {
  try {
    await api.post('/auth/logout')
  } finally {
    logout()               
    await router.push('/login')
  }
}

const userProfileList = [
  { type: 'divider' },
  {
    type: 'navItem',
    icon: 'tabler-user',
    title: 'Perfil',
    to: { name: 'perfil' },
  },
  {
    type: 'navItem',
    icon: 'tabler-settings',
    title: 'Ajustes',
    to: {
      name: 'pages-account-settings-tab',
      params: { tab: 'account' },
    },
  },
  { type: 'divider' },
]
</script>

<template>
  <VBadge
    v-if="user"
    dot
    bordered
    location="bottom right"
    offset-x="1"
    offset-y="2"
    color="success"
  >
    <VAvatar
      size="38"
      class="cursor-pointer"
      color="primary"
      variant="tonal"
    >
      <VIcon icon="tabler-user" />

      <VMenu
        activator="parent"
        width="240"
        location="bottom end"
        offset="12px"
      >
        <VList>
          <VListItem>
            <div class="d-flex gap-2 align-center">
              <VAvatar color="primary" variant="tonal">
                <VIcon icon="tabler-user" />
              </VAvatar>

              <div>
                <h6 class="text-h6 font-weight-medium">
                  {{ user.name }}
                </h6>
                <VListItemSubtitle class="text-capitalize text-disabled">
                  {{ user.username }}
                </VListItemSubtitle>
              </div>
            </div>
          </VListItem>

          <PerfectScrollbar :options="{ wheelPropagation: false }">
            <template v-for="item in userProfileList" :key="item.title">
              <VListItem
                v-if="item.type === 'navItem'"
                :to="item.to"
              >
                <template #prepend>
                  <VIcon :icon="item.icon" size="22" />
                </template>
                <VListItemTitle>{{ item.title }}</VListItemTitle>
              </VListItem>

              <VDivider v-else class="my-2" />
            </template>

            <div class="px-4 py-2">
              <VBtn
                block
                size="small"
                color="error"
                append-icon="tabler-logout"
                @click="handleLogout()"
              >
                Salir
              </VBtn>
            </div>
          </PerfectScrollbar>
        </VList>
      </VMenu>
    </VAvatar>
  </VBadge>
</template>
