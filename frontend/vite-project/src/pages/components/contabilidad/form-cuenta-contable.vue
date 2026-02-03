<script setup>
// =================================================================
// 1. IMPORTACIONES Y UTILIDADES
// =================================================================
import { ref, computed, nextTick } from "vue"
// Importar la utilidad de API
import api from '@/services/api'

// Componentes locales / externos
import AccionModal from '@/pages/components/dialogs/accion-modal.vue'
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue"
import SeleccionarCuentaContable from '@/pages/components/contabilidad/seleccionar-cuenta-contable.vue'


// =================================================================
// 2. PROPS, EMITS Y ESTADO INICIAL
// =================================================================

const props = defineProps({
  // Valores de v-model sincronizados para cada segmento de la cuenta (Data Consumer)
  cuenta1: { type: String, required: true },
  cuenta2: { type: String, required: true },
  cuenta3: { type: String, required: true },
  cuenta4: { type: String, required: true },

  aplicarRestricciones: {
    type: Boolean,
    default: true,
  },

  // La descripción ya no se maneja por v-model aquí, se envía mediante evento al padre
  // Prop para deshabilitar todos los campos y el botón
  disabled: { type: Boolean, default: false },

  // Etiqueta personalizable para el primer campo de cuenta
  labelCuenta: {
    type: String,
    default: 'Cuenta',
  },
})

const emit = defineEmits([
  'update:cuenta1',
  'update:cuenta2',
  'update:cuenta3',
  'update:cuenta4',
  'update:aplicarRestricciones',
  'cuentaSeleccionada', // Único evento para notificar al padre sobre la cuenta y descripción
])



// =================================================================
// 3. COMPUTED PROPERTIES (v-model BIDIRECCIONAL)
// =================================================================

// Propiedad computada para cuenta 1 (getter / setter)
const c1 = computed({
  get: () => props.cuenta1,
  set: value => emit('update:cuenta1', value),
})

// Propiedad computada para cuenta 2 (getter / setter)
const c2 = computed({
  get: () => props.cuenta2,
  set: value => emit('update:cuenta2', value),
})

// Propiedad computada para cuenta 3 (getter / setter)
const c3 = computed({
  get: () => props.cuenta3,
  set: value => emit('update:cuenta3', value),
})

// Propiedad computada para cuenta 4 (getter / setter)
const c4 = computed({
  get: () => props.cuenta4,
  set: value => emit('update:cuenta4', value),
})


// =================================================================
// 4. ESTADO DE UI Y MODALES
// =================================================================

const modalVisibleCC = ref(false)

const cuentasParaModal = ref({
  grupoUnoDe: '',
  grupoDosDe: '',
  grupoTresDe: '',
  grupoCuatroDe: '',
})

// Ventana de confirmación flotante (AccionModal)
const modalConfig = ref({
  visible: false,
  title: '',
  mensaje: '',
  color: 'primary',
  confirmText: 'Aceptar',
  cancelText: 'Cancelar',
  showCancelButton: true,
  callback: () => {},
})

// La función que se llama cuando se presiona el botón de confirmar en el modal
const ejecutarAccion = () => {
  modalConfig.value.callback()
}


// =================================================================
// 5. API PÚBLICA DEL COMPONENTE (Padre → Hijo)
// =================================================================

// Función expuesta para limpiar campos (llamada desde el padre)
const limpiarCuentas = () => {
  // Al asignar el valor a la propiedad computed, se dispara el emit para el padre.
  c1.value = ''
  c2.value = ''
  c3.value = ''
  c4.value = ''

  // También se limpia la descripción en el padre, pero mediante el evento
  emit('cuentaSeleccionada', { completa: '', descripcion: '' })
}

// Exponer funciones al padre
defineExpose({
  limpiarCuentas,
})


// =================================================================
// 6. LÓGICA DE VALIDACIÓN Y BÚSQUEDA DE CUENTA
// =================================================================

// Función auxiliar para rellenar con ceros
const padZerosRight = valueRef => {
  if (!valueRef.value) {
    valueRef.value = ''
    return
  }

  let val = String(valueRef.value ?? '').padEnd(9, '0')

  // Recortar si es mayor a 9
  val = val.slice(0, 9)
  valueRef.value = val
}

// Filtra solo números durante la escritura
const filtrarNumericos = event => {
  event.target.value = event.target.value.replace(/[^0-9]/g, '')
}

// Lógica al salir del campo (blur) para cada segmento de cuenta
const onBlurCuenta1 = () => {
  c1.value = c1.value.replace(/[^0-9]/g, '')
  padZerosRight(c1)
}

const onBlurCuenta2 = () => {
  c2.value = c2.value.replace(/[^0-9]/g, '')
  padZerosRight(c2)
}

const onBlurCuenta3 = () => {
  c3.value = c3.value.replace(/[^0-9]/g, '')
  padZerosRight(c3)
}

const onBlurCuenta4 = async () => {
  c4.value = c4.value.replace(/[^0-9]/g, '')
  padZerosRight(c4)

  await nextTick()
  buscarCuentaContable() // Inicia la búsqueda después de completar el último campo
}

// Buscar cuenta contable en backend
const buscarCuentaContable = async () => {
  if (!c1.value || !c2.value || !c3.value || !c4.value) return

  console.log(`Buscando cuenta contable: ${c1.value}-${c2.value}-${c3.value}-${c4.value}`)

  try {
    const res = await api.get('/contabilidad/get-cuenta-contable', {
      params: {
        cuenta1: c1.value,
        cuenta2: c2.value,
        cuenta3: c3.value,
        cuenta4: c4.value,
      },
    })

    const data = res.data
    const nuevaDescripcion = data.descripcion || ''

    // Emitir evento al padre con la cuenta y descripción
    emit('cuentaSeleccionada', {
      completa: `${c1.value}-${c2.value}-${c3.value}-${c4.value}`,
      descripcion: nuevaDescripcion,
    })
  } catch (error) {
    const status = error.response ? error.response.status : null

    const errorConfig = (title, message, color) => ({
      visible: true,
      title,
      mensaje: message,
      color,
      confirmText: 'Aceptar',
      showCancelButton: false,
      callback: () => {},
    })

    if (status === 404) {
      modalConfig.value = errorConfig(
        'Advertencia',
        'La cuenta contable no fue encontrada.',
        'warning'
      )
    } else {
      modalConfig.value = errorConfig(
        'Error Interno de la Aplicación',
        'Ocurrió un error al buscar la cuenta contable.',
        'error'
      )
    }

    // Emitir evento con descripción vacía en caso de error
    emit('cuentaSeleccionada', { completa: null, descripcion: '' })
  }
}


// =================================================================
// 7. MODAL DE SELECCIÓN DE CUENTA CONTABLE
// =================================================================

const abrirModalCC = () => {
  // Preparar las cuentas iniciales para el modal
  cuentasParaModal.value = {
    grupoUnoDe: c1.value,
    grupoDosDe: c2.value,
    grupoTresDe: c3.value,
    grupoCuatroDe: c4.value,
  }

  modalVisibleCC.value = true
}

// Traer los datos del modal y llenar los campos de cuenta y descripción
const seleccionarCuentaContableSwal = data => {
  if (!data) return

  const numeroCuentaCompleto = data.numTabla
  const partes = numeroCuentaCompleto.split('-')

  // Asignar a las propiedades computed (emite al padre)
  c1.value = partes[0] || ''
  c2.value = partes[1] || ''
  c3.value = partes[2] || ''
  c4.value = partes[3] || ''

  const nuevaDescripcion = data.nombreTabla

  emit('cuentaSeleccionada', {
    completa: numeroCuentaCompleto,
    descripcion: nuevaDescripcion,
  })
}
</script>


<template>
    <VCol cols="12" md="7">
        <VRow>
            <VCol cols="12" md="11">
                <VRow>
                <VCol cols="12" md="3">
                    <!-- Input 1 -->
                    <AppTextField
                        :model-value="c1"
                        @update:model-value="c1 = $event"
                        @blur="onBlurCuenta1"
                        @input="filtrarNumericos"
                        :disabled="disabled"
                        style="margin-top: -3px;"
                        :label="labelCuenta"
                    />
                </VCol>
                <VCol cols="12" md="3" class="mt-md-5">
                    <!-- Input 2 -->
                    <AppTextField
                        :model-value="c2"
                        @update:model-value="c2 = $event"
                        @blur="onBlurCuenta2"
                        @input="filtrarNumericos"
                        :disabled="disabled"
                    />

                </VCol>
                <VCol cols="12" md="3" class="mt-md-5">
                    <!-- Input 3 -->
                    <AppTextField
                        :model-value="c3"
                        @update:model-value="c3 = $event"
                        @blur="onBlurCuenta3"
                        @input="filtrarNumericos"
                        :disabled="disabled"
                    />
                </VCol>
                <VCol cols="12" md="3" class="mt-md-5">
                    <!-- Input 4 -->
                    <AppTextField
                        :model-value="c4"
                        @update:model-value="c4 = $event"
                        @blur="onBlurCuenta4"
                        @input="filtrarNumericos"
                        :disabled="disabled"
                    />
                </VCol>
                </VRow>
            </VCol>
            <VCol cols="12" md="1" class="mt-md-5">
                <VBtn 
                    color="primary" 
                    @click="abrirModalCC" 
                    :disabled="disabled"
                    block
                >
                    ...
                </VBtn>
            </VCol>
        </VRow>

        <!-- Modal de Selección de Cuenta Contable -->
        <SeleccionarCuentaContable
            v-model="modalVisibleCC"
            :aplicar-restricciones="props.aplicarRestricciones"
            title="Seleccionar cuenta contable"
            @submit="seleccionarCuentaContableSwal"
            :cuentas-iniciales="cuentasParaModal"
        />

    </VCol>


    
  <AccionModal
    v-model="modalConfig.visible"
    :title="modalConfig.title"
    :mensaje="modalConfig.mensaje"
    :confirm-text="modalConfig.confirmText"
    :cancel-text="modalConfig.cancelText"
    :color="modalConfig.color"
    :show-cancel-button="modalConfig.showCancelButton"
    @confirm="ejecutarAccion"
  />
</template>

<style scoped>
.comprimir-col {
 margin-top: -10px; 
 margin-bottom: -10px; 
}
</style>