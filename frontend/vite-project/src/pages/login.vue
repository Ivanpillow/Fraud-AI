<script setup>
import SocialLinks from '@/views/pages/otros/socialLinks.vue'
import authV1BottomShape from '@images/svg/auth-v1-bottom-shape.svg?raw'
import authV1TopShape from '@images/svg/auth-v1-top-shape.svg?raw'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'


import { useUiPermissions } from '@/composables/useUiPermissions'
import { useAuth } from '@/composables/useAuth'


definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const form = ref({
  email: '',
  password: '',
  remember: false,
})

const isPasswordVisible = ref(false)




const errors = ref({
  login: undefined,
  password: undefined,
})

const refVForm = ref()

const credentials = ref({
  login: 'admin@gmail.com',
  password: '123456',
})



const { login, fetchSession } = useAuth()
// const { fetchUiPermissions } = useUiPermissions()

const loginUser = async () => {
  try {
    await login({
      login: credentials.value.login,
      password: credentials.value.password,
    })

    await fetchSession()
    // await fetchUiPermissions()

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
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <div class="position-relative my-sm-16">
      <!-- 👉 Top shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1TopShape })"
        class="text-primary auth-v1-top-shape d-none d-sm-block"
      />

      <!-- 👉 Bottom shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1BottomShape })"
        class="text-primary auth-v1-bottom-shape d-none d-sm-block"
      />

      <!-- 👉 Auth Card -->
      <VCard
        class="auth-card"
        max-width="460"
        :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'"
      >
        <!-- <VCardItem class="justify-center">
          <VCardTitle>
            <RouterLink to="/">
              <div class="app-logo">
                <VNodeRenderer :nodes="themeConfig.app.logo" />
                <h1 class="app-logo-title">
                  {{ themeConfig.app.title }}
                </h1>
              </div>
            </RouterLink>
          </VCardTitle>
        </VCardItem> -->

        <VCardText>
          <h4 class="text-h4 mb-1 text-center">
            <span class="text-capitalize">{{ themeConfig.app.title }}</span>
          </h4>
          <p class="mb-0">
            Por favor, inicie sesión.
          </p>
        </VCardText>

        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="credentials.login"
                  autofocus
                  label="Correo electrónico"
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  :error-messages="errors.login"
                  :rules="[requiredValidator, emailValidator]"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="credentials.password"
                  label="Contraseña"
                  placeholder="Ingresa tu contraseña"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible",
                  :error-messages="errors.password"
                />

                <!-- remember me checkbox -->
                <!-- <div class="d-flex align-center justify-space-between flex-wrap my-6">
                  <VCheckbox
                    v-model="form.remember"
                    label="Remember me"
                  />

                  <RouterLink
                    class="text-primary"
                    :to="{ name: 'pages-authentication-forgot-password-v1' }"
                  >
                    Forgot Password?
                  </RouterLink>
                </div> -->

                <!-- login button -->
                <VBtn
                  block
                  type="submit"
                  class="mt-9"
                >
                  Iniciar sesión
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol
                cols="12"
                class="text-body-1 text-center"
              >
                <span class="d-inline-block">
                  Frase chida aqui
                </span>
                <!-- <RouterLink
                  class="text-primary ms-1 d-inline-block text-body-1"
                  :to="{ name: 'pages-authentication-register-v1' }"
                >
                  Create an account
                </RouterLink> -->
              </VCol>

              <VCol
                cols="12"
                class="d-flex align-center"
              >
                <VDivider />
                <span class="mx-4 text-high-emphasis">Conócenos</span>
                <VDivider />
              </VCol>

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
    </div>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
