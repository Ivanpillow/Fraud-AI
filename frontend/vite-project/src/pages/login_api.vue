<!-- ❗Errors in the form are set on line 60 -->
<script setup>
import { VForm } from 'vuetify/components/VForm'
// import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import SocialLinks from '@/views/pages/otros/socialLinks.vue'

import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
// import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationDark from '@images/pages/img_loader.png'
import authV2LoginIllustrationLight from '@images/pages/img_loader.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

import api from '@/services/api'
import { $api } from '@/utils/api'

// import { usePermissions } from '@/composables/usePermissions'
import { useUiPermissions } from '@/composables/useUiPermissions'
import { useAuth } from '@/composables/useAuth'


const { setPermissionsAndRole } = usePermissions()

// ###############################
/* import api from '@/services/api'

api.get('/test-db').then(response => {
  console.log('Datos del backend:', response.data)
}) */

// ###############################


const authThemeImg = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark, authV2LoginIllustrationBorderedLight, authV2LoginIllustrationBorderedDark, true)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const isPasswordVisible = ref(false)
const route = useRoute()
const router = useRouter()
// const ability = useAbility()

const errors = ref({
  login: undefined,
  password: undefined,
})

const refVForm = ref()

const credentials = ref({
  // email: 'admin@demo.com',
  // password: 'admin',
  login: 'xDelVivar',
  password: 'Casa81',
})

const rememberMe = ref(false)

const { login, fetchSession } = useAuth()
const { fetchUiPermissions } = useUiPermissions()

const loginUser = async () => {
  try {
    await login({
      login: credentials.value.login,
      password: credentials.value.password,
    })

    await fetchSession()
    await fetchUiPermissions()

    // router.replace(route.query.to || '/inicio')
    window.location.href = '/inicio'
  } catch {
    errors.value = {
      login: 'Credenciales incorrectas',
      password: 'Credenciales incorrectas',
    }
  }
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid)
      loginUser()
  })
}
</script>

<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      
    </div>
  </RouterLink>

  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background w-100 me-0">
        <div
          class="d-flex align-center justify-center w-100 h-100"
          style="padding-inline: 6.25rem;"
        >
          <VImg
            max-width="613"
            :src="authThemeImg"
            class="auth-illustration mt-16 mb-2"
          />
        </div>

        <img
          class="auth-footer-mask"
          :src="authThemeMask"
          alt="auth-footer-mask"
          height="280"
          width="100"
        >
      </div>
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-4"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            <span class="text-capitalize"> Casa Administraciones</span>
          </h4>
          <p class="mb-0">
            Por favor, inicie sesión en su cuenta para comenzar.
          </p>
        </VCardText>
        <!-- <VCardText>
          <VAlert
            color="primary"
            variant="tonal"
          >
            <p class="text-sm mb-2">
              Admin Email: <strong>admin@demo.com</strong> / Pass: <strong>admin</strong>
            </p>
            <p class="text-sm mb-0">
              Client Email: <strong>client@demo.com</strong> / Pass: <strong>client</strong>
            </p>
          </VAlert>
        </VCardText> -->
        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- Nombre de usuario -->
              <VCol cols="12">
                <AppTextField
                  v-model="credentials.login"
                  label="Usuario"
                  type="text"
                  autofocus
                  :rules="[requiredValidator]"
                  :error-messages="errors.login"
                />
              </VCol>

              <!-- Password -->
              <VCol cols="12">
                <AppTextField
                  v-model="credentials.password"
                  label="Password"
                  :rules="[requiredValidator]"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  :error-messages="errors.password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <div class="d-flex align-center flex-wrap justify-space-between my-6">
                  
                </div>

                <VBtn
                  block
                  type="submit"
                >
                  Iniciar sesión
                </VBtn>
              </VCol>

               <!-- create account -->
                
              <VCol
                cols="12"
                class="text-center"
              >
                <span>Encuentra la propiedad adecuada para tí.</span>
                <a
                  class="text-primary ms-1"
                  href="https://casaadministraciones.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ingresa aquí
                </a>
              </VCol>


              <VCol
                cols="12"
                class="d-flex align-center"
              >
                <VDivider />
                <VDivider />
              </VCol>

              <!-- Social Links -->
              <VCol
                cols="12"
                class="text-center"
              >
                <SocialLinks />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>