<script setup>
import { useConfigStore } from '@core/stores/config'
import { AppContentLayoutNav } from '@layouts/enums'
import { switchToVerticalNavOnLtOverlayNavBreakpoint } from '@layouts/utils'

import { useUiModalsStore } from '@/stores/uiModals'
import MovimientosAuxiliaresModal from '@/pages/components/contabilidad/movimientos-auxiliares.vue'

import { useRoute, useRouter } from 'vue-router'
import { watch } from 'vue'

const uiModals = useUiModalsStore()


const route = useRoute()
const router = useRouter()

watch(
  () => route.query.modal,
  value => {
    if (value === 'movimientosAuxiliares') {
      uiModals.openMovimientosAuxiliares()

      // limpiar la URL sin recargar
      router.replace({ query: {} })
    }
  },
  { immediate: true }
)

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithHorizontalNav.vue'))
const DefaultLayoutWithVerticalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithVerticalNav.vue'))
const configStore = useConfigStore()

// ℹ️ This will switch to vertical nav when define breakpoint is reached when in horizontal nav layout

// Remove below composable usage if you are not using horizontal nav layout in your app
switchToVerticalNavOnLtOverlayNavBreakpoint()

const { layoutAttrs, injectSkinClasses } = useSkins()

injectSkinClasses()

// SECTION: Loading Indicator
const isFallbackStateActive = ref(false)
const refLoadingIndicator = ref(null)

watch([
  isFallbackStateActive,
  refLoadingIndicator,
], () => {
  if (isFallbackStateActive.value && refLoadingIndicator.value)
    refLoadingIndicator.value.fallbackHandle()
  if (!isFallbackStateActive.value && refLoadingIndicator.value)
    refLoadingIndicator.value.resolveHandle()
}, { immediate: true })
// !SECTION
</script>

<template>
  <Component
    v-bind="layoutAttrs"
    :is="configStore.appContentLayoutNav === AppContentLayoutNav.Vertical ? DefaultLayoutWithVerticalNav : DefaultLayoutWithHorizontalNav"
  >
    <AppLoadingIndicator ref="refLoadingIndicator" />

    <RouterView v-slot="{ Component }">
      <Suspense
        :timeout="0"
        @fallback="isFallbackStateActive = true"
        @resolve="isFallbackStateActive = false"
      >
        <Component :is="Component" />
      </Suspense>
    </RouterView>
  </Component>

  <MovimientosAuxiliaresModal
    v-model="uiModals.movimientosAuxiliares"
    @update:modelValue="val => {
      if (!val) uiModals.closeMovimientosAuxiliares()
    }"
  />
</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use "@layouts/styles/default-layout";
// --- AGREGA ESTO AL FINAL ---

// Forzamos que el ítem con la clase 'nav-no-active' ignore los estilos de "activo"
.layout-vertical-nav {
  .nav-link.nav-no-active {
    // Sobrescribimos cuando el router dice que está activo
    &.router-link-active,
    &.router-link-exact-active,
    &.v-list-item--active {
      
      // 1. Quitar el fondo (degradado o color sólido)
      background: transparent !important;
      background-image: none !important;
      box-shadow: none !important;

      // 2. Restaurar el color del texto e ícono (al gris normal del menú)
      // Nota: Usamos 'inherit' o variables de tema para que se vea inactivo
      color: rgba(var(--v-theme-on-surface), 0.87) !important;
      
      // Aseguramos que el ícono interno también pierda el color de "activo"
      .v-icon {
        color: inherit !important;
      }

      // 3. (Opcional) Mantener el efecto hover para que se sienta interactivo
      &:hover {
        background-color: rgba(var(--v-theme-on-surface), 0.04) !important;
      }
    }
  }
}
</style>
