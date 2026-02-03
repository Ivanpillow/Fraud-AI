<script setup>
const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})


const isUserInfoEditDialogVisible = ref(false)
const isUpgradePlanDialogVisible = ref(false)
const resolveUserRoleVariant = role => {
  if ([
    'ADMINISTRADOR-SUPERIOR',
    'ADMINISTRADOR',
    'GERENTE-RENTAS-PLUS'
  ].includes(role))
    return { color: 'warning', icon: 'tabler-user' }

  if ([
    'VENTAS',
    'VENTAS-RENTAS-PLUS',
    'PUBLICIDAD',
    'MERCADOTECNIA',
    'INFORMES_RENTAS_Y_VENTAS',
    'ATENCIÓN',
    'ATENCIÓN A PROPIETARIOS',
    'SEGUIMIENTO A PROPIETARIOS',
    'ATENCIÓN-CONTRATOS'
  ].includes(role))
    return { color: 'success', icon: 'tabler-circle-check' }

  if ([
    'MTTO-DESOCUPACION-LIMPIEZA',
    'MANTENIMIENTO',
    'MANTENIMIENTO-DESOCUPACIONES',
    'TECNICOS-MANTENIMIENTO',
    'COORDINACION_MTTO',
    'COORDINADOR_OPERATIVO_MTTO',
    'RH-LIMPIEZA'
  ].includes(role))
    return { color: 'primary', icon: 'tabler-tools' }

  if ([
    'CONTRATOS',
    'CONTRATOS_SERVICIOS',
    'JURIDICO-COBRANZA',
    'JURÍDICO',
    'AUX-JURIDICO',
    'INMUEBLES_SERVICIOS'
  ].includes(role))
    return { color: 'info', icon: 'tabler-file-description' }

  if ([
    'COBRANZA',
    'COORDINADOR_COBRANZA',
    'CAJERO',
    'LIQUIDACIONES',
    'LIQUIDACIONES-CONTA',
    'RETENCIONES',
    'CONTABILIDAD'
  ].includes(role))
    return { color: 'secondary', icon: 'tabler-cash' }

  if ([
    'INMUEBLES',
    'INMUEBLE-RENTAS-PLUS',
    'INQUILINO-DESOCUPACIONES',
    'DESOCUPACIONES',
    'INMUEBLE_RENTAS_PLUS_PROPIETARIOS',
    'ADMINISTRAR PROPIETARIOS'
  ].includes(role))
    return { color: 'orange', icon: 'tabler-building' }

  if ([
    'BECARIO',
    'BECARIO_INQUILINOS',
    'ASESOR-TRADICIONAL'
  ].includes(role))
    return { color: 'purple', icon: 'tabler-user-plus' }

  return { color: 'primary', icon: 'tabler-user' }
}
</script>

<template>
  <VRow>
    <!-- SECTION User Details -->
    <VCol cols="12">
      <VCard v-if="props.userData">
        <VCardText class="text-center pt-12">
          <!-- 👉 Avatar -->
          <VAvatar
            rounded
            :size="100"
            :color="!props.userData.avatar ? 'primary' : undefined"
            :variant="!props.userData.avatar ? 'tonal' : undefined"
          >
            <VImg
              v-if="props.userData.avatar"
              :src="props.userData.avatar"
            />
            <span
              v-else
              class="text-5xl font-weight-medium"
            >
              {{ avatarText(props.userData.nombre) }}
            </span>
          </VAvatar>

          <!-- 👉 User fullName -->
          <h5 class="text-h5 mt-4">
            {{ props.userData.nombre_completo }}
          </h5>

          <!-- 👉 Role chip -->
          <VChip
            label
            :color="resolveUserRoleVariant(props.userData.nombreRol).color"
            size="small"
            class="text-capitalize mt-4"
          >
            {{ props.userData.puesto.toUpperCase() }}
          </VChip>
        </VCardText>

        <VCardText>
          <div class="d-flex justify-space-around gap-x-6 gap-y-2 flex-wrap mb-6">
            <!-- 👉 Done task
            <div class="d-flex align-center me-8">
              <VAvatar
                :size="40"
                rounded
                color="primary"
                variant="tonal"
                class="me-4"
              >
                <VIcon
                  icon="tabler-checkbox"
                  size="24"
                />
              </VAvatar>
              <div>
                <h5 class="text-h5">
                  {{ `${(props.userData.taskDone / 1000).toFixed(2)}k` }}
                </h5>

                <span class="text-sm">Task Done</span>
              </div>
            </div> -->

            <!-- 👉 Done Project
            <div class="d-flex align-center me-4">
              <VAvatar
                :size="38"
                rounded
                color="primary"
                variant="tonal"
                class="me-4"
              >
                <VIcon
                  icon="tabler-briefcase"
                  size="24"
                />
              </VAvatar>
              <div>
                <h5 class="text-h5">
                  {{ kFormatter(props.userData.projectDone) }}
                </h5>
                <span class="text-sm">Project Done</span>
              </div>
            </div> -->
          </div>

          <!-- 👉 Details -->
          <h5 class="text-h5">
            Detalles
          </h5>

          <VDivider class="my-4" />

          <!-- 👉 User Details list -->
          <VList class="card-list mt-2">
            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Usuario:
                  <div class="d-inline-block text-body-1">
                    {{ props.userData.username }}
                  </div>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <span class="text-h6">
                  Correo Electrónico:
                </span>
                <span class="text-body-1">
                  {{ props.userData.correo.toLowerCase() }}
                </span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Status:
                  <div class="d-inline-block text-body-1 text-capitalize">
                    {{ props.userData.activo.toLowerCase() }}
                  </div>
                </h6>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Rol:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ props.userData.nombreRol.toLowerCase()  }}
                  </div>
                </h6>
              </VListItemTitle>
            </VListItem>

            
            <VListItem>
              <VListItemTitle>
                <h6 class="text-h6">
                  Departamento:
                  <div class="d-inline-block text-capitalize text-body-1">
                    {{ props.userData.nombreDepartamento.toLowerCase()  }}
                  </div>
                </h6>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCardText>

        <!-- 👉 Edit and Suspend button
        <VCardText class="d-flex justify-center gap-x-4">
          <VBtn
            variant="elevated"
            @click="isUserInfoEditDialogVisible = true"
          >
            Editar
          </VBtn>

          <VBtn
            variant="tonal"
            color="error"
          >
            Suspender
          </VBtn>
        </VCardText> -->
      </VCard>
    </VCol>
    <!-- !SECTION -->


    <!-- !SECTION -->
  </VRow>

  <!-- Edit user info dialog
  <UserInfoEditDialog
    v-model:is-dialog-visible="isUserInfoEditDialogVisible"
    :user-data="props.userData"
  />

  Upgrade plan dialog 
  <UserUpgradePlanDialog v-model:is-dialog-visible="isUpgradePlanDialogVisible" /> -->
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 0.5rem;
}

.text-capitalize {
  text-transform: capitalize !important;
}
</style>
