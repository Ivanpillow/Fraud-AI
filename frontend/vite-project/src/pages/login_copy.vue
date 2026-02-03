<!-- ❗Errors in the form are set on line 60 -->
<script setup>
//useCookie('accessToken').value = null
//useCookie('userData').value = null
//useCookie('userAbilityRules').value = null
//document.cookie.split(';').forEach(c => {
//  document.cookie = c.trim().replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/')
//})

import { VForm } from 'vuetify/components/VForm'
import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

import api from '@/services/api'
import { $api } from '@/utils/api'

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
const ability = useAbility()

const errors = ref({
  login: undefined,
  password: undefined,
})

const refVForm = ref()

const credentials = ref({
  login: 'xDelVivar',
  password: 'Casa81',
})

const rememberMe = ref(false)



const login = async () => {
  try {
    const res = await api.post('/auth/login', {
      login: credentials.value.login,
      password: credentials.value.password,
    })

    const { accessToken, userData, userAbilityRules } = res.data

    //useCookie('accessToken', { maxAge: 300 }).value = accessToken // token guardado en una cookie con una duración de 5 minutos
    console.log('Token guardado:', accessToken)
    //useCookie('userData').value = userData
    //useCookie('userAbilityRules').value = userAbilityRules || []

    ability.update(userAbilityRules || [])

    await nextTick(() => {
      console.log('Redireccionando a:', route.query.to ? String(route.query.to) : '/')
      //router.replace(route.query.to ? String(route.query.to) : '/')
      //router.replace('/usuarios')
    })
  } catch (err) {
    if (err.response && err.response.status === 401) {
      errors.value = {
        login: 'Credenciales incorrectas',
        password: 'Credenciales incorrectas',
      }
    } else {
      console.error('Error de login:', err)
    }
  }
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid)
      login()
  })
}
</script>

<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
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
            <span class="text-capitalize"> {{ themeConfig.app.title }} </span> 
          </h4>
          <p class="mb-0">
            Por favor, inicie sesión en su cuenta para comenzar.
          </p>
        </VCardText>
        <!--<VCardText>
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
        </VCardText>-->
        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- usuario -->
              <VCol cols="12">
                <AppTextField
                  v-model="credentials.login"
                  label="Usuario"
                  placeholder="angel"
                  type="text"
                  autofocus
                  :rules="[requiredValidator]"
                  :error-messages="errors.login"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="credentials.password"
                  label="Password"
                  placeholder="············"
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

              
              <VCol
                cols="12"
                class="d-flex align-center"
              >
                <VDivider /><VDivider />
              </VCol>

              <!-- auth providers -->
              <VCol
                cols="12"
                class="text-center"
              >
                <AuthProvider />
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
