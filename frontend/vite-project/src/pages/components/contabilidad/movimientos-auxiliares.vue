<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { useTheme } from 'vuetify'

import AccionModal from '@/pages/components/dialogs/accion-modal.vue'
import TemporaryMessage from '@/pages/components/dialogs/mensaje-temporal-dialog.vue'
import InputCuentaContable from '@/pages/components/contabilidad/form-cuenta-contable.vue'

import api from '@/services/api'

/* ================== MODAL BASE ================== */
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: 'Imprimir Reporte de Movimientos Auxiliares' },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(props.modelValue)

function updateModel(val) {
  emit('update:modelValue', val)
}


/* ================== THEME ================== */
const theme = useTheme()
const isDarkTheme = computed(() => theme.global.name.value === 'dark')


// =================================================================
// 2. DEFINICIÓN DE ESTADO Y CONSTANTES
// =================================================================


// ===================== VENTANAS FLOTANTES ========================


// Ventana de confirmación flotante
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

// Mensaje temporal flotante
const temporalModalConfig = ref({
  visible: false,
  title: 'Notificación',
  mensaje: '',
  color: 'info',
  timeout: 3000,
})


// ===================== FILTROS DEL REPORTE =======================

// Flags de tipo de consulta
const movimientosPorPeriodo = ref(true)

// Rangos de periodo / ejercicio
const periodoInicial = ref(null)
const periodoFinal = ref(null)
const ejercicioInicial = ref(null)
const ejercicioFinal = ref(null)

// Rangos de fechas
const fechaHoy = new Date()
const movimientosDel = ref(fechaHoy)
const movimientosHasta = ref(fechaHoy)

// Filtros contables
const tipoCuenta = ref(0)
const naturaleza = ref(0)

// Flags
const tipoCuentaFlag = ref(true)
const cuentasConMovimientosYSaldos = ref(false)

// Aplicar restricciones al validar cuenta contable
const aplicarRestricciones = ref(false)

// ===================== CUENTA CONTABLE A =========================

const inputCuentaContableARef = ref(null);
const cuenta1A = ref('')
const cuenta2A = ref('')
const cuenta3A = ref('')
const cuenta4A = ref('')
const descripcionCuentaA = ref('')


// ===================== CUENTA CONTABLE B =========================

const inputCuentaContableBRef = ref(null);
const cuenta1B = ref('')
const cuenta2B = ref('')
const cuenta3B = ref('')
const cuenta4B = ref('')
const descripcionCuentaB = ref('')


// ===================== OPCIONES DE CUENTAS =======================

const cuentasCon = ref(0)


// ===================== CATÁLOGOS ================================

const meses = [
  { value: null, text: '-- Mes --' },
  { value: 1, text: 'Enero' },
  { value: 2, text: 'Febrero' },
  { value: 3, text: 'Marzo' },
  { value: 4, text: 'Abril' },
  { value: 5, text: 'Mayo' },
  { value: 6, text: 'Junio' },
  { value: 7, text: 'Julio' },
  { value: 8, text: 'Agosto' },
  { value: 9, text: 'Septiembre' },
  { value: 10, text: 'Octubre' },
  { value: 11, text: 'Noviembre' },
  { value: 12, text: 'Diciembre' },
]

const currentYear = new Date().getFullYear()
const years = [
  { value: null, text: '-- Año --' }
]

for (let year = currentYear; year >= 2010; year--) {
  years.push({ value: year, text: year.toString() })
}


const porTipoCuentaItems = [
  { value: 0, text: 'Todas' },
  { value: 1, text: 'Algunas' },
  { value: 2, text: 'De Cuadre' },
]

const naturalezaItems = [
  { value: 0, text: 'Todos' },
  { value: 1, text: 'Naturaleza Acreedora' },
  { value: 2, text: 'Naturaleza Deudora' },
]



// =================================================================
// 3. LÓGICA DE API Y FUNCIONES CENTRALES
// =================================================================

// Función para imprimir el reporte
const imprimirReporte = async () => {
  const errores = []

  // ===============  REGLAS DE VALIDACIÓN  ===============

  // Fechas
  if (!movimientosPorPeriodo.value) {
    // Validar rango de fechas
    if (!movimientosDel.value) {
      errores.push('El Campo *Movimientos Del* es obligatorio.')
    }
    if (!movimientosHasta.value) {
      errores.push('El Campo *Movimientos Hasta* es obligatorio.')
    }
    if (movimientosDel.value && movimientosHasta.value) {
      if (new Date(movimientosDel.value) > new Date(movimientosHasta.value)) {
        errores.push('La fecha *Movimientos Del* no puede ser mayor que la fecha *Movimientos Hasta*.')
      }
    }
  } else {
    // Validar rango de periodo y ejercicio
    if (!periodoInicial.value) {
      errores.push('El Campo *Periodo Inicial* es obligatorio.')
    }
    if (!periodoFinal.value) {
      errores.push('El Campo *Periodo Final* es obligatorio.')
    }
    if (!ejercicioInicial.value) {
      errores.push('El Campo *Ejercicio Inicial* es obligatorio.')
    }
    if (!ejercicioFinal.value) {
      errores.push('El Campo *Ejercicio Final* es obligatorio.')
    }
  }

  // CUENTAS CONTABLES
  if(tipoCuenta.value === 1) {
    // Validar que se haya seleccionado una cuenta en A y B
    const cuentaACompleta = [cuenta1A.value, cuenta2A.value, cuenta3A.value, cuenta4A.value].filter(part => part).join('-')
    const cuentaBCompleta = [cuenta1B.value, cuenta2B.value, cuenta3B.value, cuenta4B.value].filter(part => part).join('-')

    if (!cuentaACompleta) {
      errores.push('El Campo *Cuenta Inicial* es obligatorio cuando el filtro es "Algunas".')
    }
    if (!cuentaBCompleta) {
      errores.push('El Campo *Cuenta Final* es obligatorio cuando el filtro es "Algunas".')
    }
  }

  // ============ MOSTRAR ERRORES =============
  // 
  if (errores.length > 0) {
      // Concatenar los errores
      const mensajeConcatenado = `Se encontraron ${errores.length} errores de validación:<br><ul><li>${errores.join("</li><li>")}</li></ul>`;
      
      modalConfig.value = {
          visible: true, 
          title: 'Errores de Validación',
          mensaje: mensajeConcatenado,
          color: 'warning',
          confirmText: 'Aceptar',
          showCancelButton: false, 
          callback: () => {}, 
      };
      return; // Detener la ejecución si hay errores
  }

  // ============ IMPRIMIR REPORTE =============

  const payload = {
    filtro_periodo: movimientosPorPeriodo.value,

    periodo_inicial: movimientosPorPeriodo.value ? periodoInicial.value : null,
    periodo_final: movimientosPorPeriodo.value ? periodoFinal.value : null,

    ejercicio_inicial: movimientosPorPeriodo.value ? ejercicioInicial.value : null,
    ejercicio_final: movimientosPorPeriodo.value ? ejercicioFinal.value : null,

    fecha_inicial: !movimientosPorPeriodo.value ? toDateISO(movimientosDel.value) : null,
    fecha_final: !movimientosPorPeriodo.value ? toDateISO(movimientosHasta.value) : null,

    tipo_cuenta: tipoCuenta.value || null,
    naturaleza: naturaleza.value || null,

    cuenta1A: cuenta1A.value || null,
    cuenta2A: cuenta2A.value || null,
    cuenta3A: cuenta3A.value || null,
    cuenta4A: cuenta4A.value || null,

    cuenta_inicial: buildCuenta(cuenta1A.value, cuenta2A.value, cuenta3A.value, cuenta4A.value),

    cuenta1B: cuenta1B.value || null,
    cuenta2B: cuenta2B.value || null,
    cuenta3B: cuenta3B.value || null,
    cuenta4B: cuenta4B.value || null,

    cuenta_final: buildCuenta(cuenta1B.value, cuenta2B.value, cuenta3B.value, cuenta4B.value),

    cuentas_con: cuentasCon.value,
  }

  // Eliminar propiedades con valor null
  const payloadLimpio = Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== null)
  )


  const win = window.open('', '_blank')


  try {
    const res = await api.post('/contabilidad/reporte/movimientos-auxiliares', payloadLimpio, { responseType: 'text' })

    win.document.write(res.data)
    win.document.close()

    if(res.result === 'error') {
      modalConfig.value = {
        visible: true,
        title: 'Error al Generar el Reporte',
        mensaje: res.message || 'Ocurrió un error al generar el reporte.',
        color: 'error',
        confirmText: 'Aceptar',
        showCancelButton: false,
        callback: () => {},
      }
      return
    }


  } catch (error) {
    console.error('Error completo:', error)

    if (error.response) {
      console.error(
        'Error backend:',
        JSON.stringify(error.response.data, null, 2)
      )
    }

    modalConfig.value = {
      visible: true,
      title: 'Error Interno de la Aplicación',
      mensaje: 'Ocurrió un error inesperado al procesar el reporte.',
      color: 'error',
      confirmText: 'Aceptar',
      showCancelButton: false,
      callback: () => {},
    }
  }

}



// =================================================================
// 4. FUNCIONES AUXILIARES DE INTERFAZ
// =================================================================

// Se ejecuta cuando el InputCuentaContable A encuentra o selecciona una cuenta
const handleCuentaA = (data) => {
  descripcionCuentaA.value = data.descripcion


  // Asignar los valores de cuenta al formulario de cuenta B
  const partesCuenta = data.completa.split('-')

  cuenta1B.value = partesCuenta[0] || ''
  cuenta2B.value = partesCuenta[1] || ''
  cuenta3B.value = partesCuenta[2] || ''
  cuenta4B.value = partesCuenta[3] || ''
  descripcionCuentaB.value = data.descripcion
}

// Se ejecuta cuando el InputCuentaContable B encuentra o selecciona una cuenta
const handleCuentaB = (data) => {
  descripcionCuentaB.value = data.descripcion
}

// Ejecutar acción del modal
const ejecutarAccion = () => {
  modalConfig.value.callback()
}

// Reiniciar campos
const resetFields = () => {
  // Flags
  movimientosPorPeriodo.value = true

  // Periodos
  periodoInicial.value = null
  periodoFinal.value = null
  ejercicioInicial.value = null
  ejercicioFinal.value = null

  // Fechas
  const hoy = new Date()
  movimientosDel.value = hoy
  movimientosHasta.value = hoy

  // Filtros
  tipoCuenta.value = 0
  naturaleza.value = 0

  tipoCuentaFlag.value = true
  cuentasConMovimientosYSaldos.value = false

  // Cuenta A
  cuenta1A.value = ''
  cuenta2A.value = ''
  cuenta3A.value = ''
  cuenta4A.value = ''
  descripcionCuentaA.value = ''

  // Cuenta B
  cuenta1B.value = ''
  cuenta2B.value = ''
  cuenta3B.value = ''
  cuenta4B.value = ''
  descripcionCuentaB.value = ''

  // Radio group
  cuentasCon.value = 0

  // Limpiar componentes hijos
  inputCuentaContableARef.value?.limpiarCuentas()
  inputCuentaContableBRef.value?.limpiarCuentas()
}


const buildCuenta = (c1, c2, c3, c4) => {
  if (!c1) return null
  return [c1, c2, c3, c4].filter(Boolean).join('-')
}

const toDateISO = (value) => {
  if (!value) return null

  // Caso string DD/MM/YYYY
  if (typeof value === 'string' && value.includes('/')) {
    const [day, month, year] = value.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Caso string ISO o Date
  const d = new Date(value)
  if (isNaN(d)) return null

  return d.toISOString().substring(0, 10)
}


// =================================================================
// 5. WATCHERS
// =================================================================

// Sincronizar isOpen con modelValue y resetear el formulario al abrir
watch(() => props.modelValue, async (val) => {
  isOpen.value = val
  if (val) {
    await nextTick()
    resetFields()
  }
})

// Watcher para alternar entre reporte por periodo y por fechas
watch(movimientosPorPeriodo, (activo) => {
  if (activo) {
    // Limpiar rango de fechas
    movimientosDel.value = fechaHoy
    movimientosHasta.value = fechaHoy

  } else {
    // Limpiar rango por periodo de liquidación
    periodoInicial.value = null
    periodoFinal.value = null
    ejercicioInicial.value = null
    ejercicioFinal.value = null
  }
})


watch(tipoCuenta, (newValue) => {
  if (newValue == 0) {  // Todas
    tipoCuentaFlag.value = true
    
    if (inputCuentaContableARef.value) {
        inputCuentaContableARef.value.limpiarCuentas();
    }

    if (inputCuentaContableBRef.value) {
        inputCuentaContableBRef.value.limpiarCuentas();
    }

    cuentasConMovimientosYSaldos.value = false
    
  } else if (newValue == 1) { // Algunas
    tipoCuentaFlag.value = false
    cuentasConMovimientosYSaldos.value = false

  } else if (newValue == 2) { // De Cuadre
    tipoCuentaFlag.value = true
    
    if (inputCuentaContableARef.value) {
        inputCuentaContableARef.value.limpiarCuentas();
    }

    if (inputCuentaContableBRef.value) {
        inputCuentaContableBRef.value.limpiarCuentas();
    }

    cuentasConMovimientosYSaldos.value = true

  } 
})


</script>




<template>
  <VDialog
    v-model="isOpen"
    :model-value="modelValue"
    @update:model-value="updateModel"
    max-width="1200px"
    persistent
    :retain-focus="false"
  >
    <VCard>
      <VCardTitle class="d-flex justify-space-between">
        <span>{{ title }}</span>
        <VBtn icon="tabler-x" variant="text" @click="updateModel(false)" />
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="() => {}">

                <VRow>
                    <VCol cols="12" class="">
                        <VCheckbox
                            v-model="movimientosPorPeriodo"
                            label="Reporte de Movimientos Auxiliares por Periodo"
                        />
                    </VCol>
                </VRow>
                <VRow>
                    <VCol cols="12" class="text-overline font-weight-bold">
                        <VDivider class="mb-5"/>
                        Rango por Periodo de Liquidación
                    </VCol>
                </VRow>
                <VRow>
                    <!-- Periodo Inicial-->
                    <VCol cols="6" md="6" class="comprimir-col">
                        <AppSelect
                        v-model="periodoInicial"
                        label="Periodo Inicial"
                        placeholder="Mes"
                        :items="meses"
                        item-title="text"
                        item-value="value"
                        :disabled="!movimientosPorPeriodo"
                        />
                    </VCol>

                    
                    <!-- Periodo Final-->
                    <VCol cols="6" md="6" class="comprimir-col">
                        <AppSelect
                        v-model="periodoFinal"
                        label="Periodo Final"
                        placeholder="Mes"
                        :items="meses"
                        item-title="text"
                        item-value="value"
                        :disabled="!movimientosPorPeriodo"
                        />
                    </VCol>

                </VRow> 

                <VRow>
                    <!-- Año Inicial -->
                    <VCol cols="6" md="6" class="comprimir-col">
                        <AppSelect
                        v-model="ejercicioInicial"
                        label="Ejercicio Inicial"
                        placeholder="Año"
                        :items="years"
                        item-title="text"
                        item-value="value"
                        :disabled="!movimientosPorPeriodo"
                        />
                    </VCol>

                    
                    <!-- Año Final -->
                    <VCol cols="6" md="6" class="comprimir-col">
                        <AppSelect
                        v-model="ejercicioFinal"
                        label="Ejercicio Final"
                        placeholder="Año"
                        :items="years"
                        item-title="text"
                        item-value="value"
                        :disabled="!movimientosPorPeriodo"
                        />
                    </VCol>

                </VRow> 

                

                <VRow>
                    <VCol cols="12" class="text-overline font-weight-bold">
                        <VDivider class="mt-5 mb-5"/>
                        Rango de Fechas
                    </VCol>
                </VRow>
                <VRow>
                    <!-- Movimientos Del -->
                    <VCol cols="6" md="6" class="comprimir-col">
                        <AppDateTimePicker
                        v-model="movimientosDel"
                        label="* Movimientos Del"
                        placeholder="Selecciona la fecha"
                        :disabled="movimientosPorPeriodo"
                        />
                    </VCol>

                    <!-- Movimientos Hasta -->
                    <VCol cols="6" md="6" class="comprimir-col">
                        <AppDateTimePicker
                        v-model="movimientosHasta"
                        label="* Movimientos Hasta"
                        placeholder="Selecciona la fecha"
                        :disabled="movimientosPorPeriodo"
                        />
                    </VCol>

                    
                </VRow> 


                <VRow>
                    <VCol cols="12" class="text-overline font-weight-bold">
                        <VDivider class="mt-5 mb-5"/>
                        Cuentas
                    </VCol>
                </VRow>
                <VRow>
                    <!-- Por Tipo de Cuenta -->
                    <VCol cols="6" md="6" class="comprimir-col">
                        <AppSelect
                        v-model="tipoCuenta"
                        label="Por Tipo de Cuenta"
                        placeholder="Tipo de Cuenta"
                        :items="porTipoCuentaItems"
                        item-title="text"
                        item-value="value"
                        />
                    </VCol>

                    
                    <!-- Naturaleza -->
                    <VCol cols="6" md="6" class="comprimir-col">
                        <AppSelect
                        v-model="naturaleza"
                        label="Naturaleza"
                        placeholder="Naturaleza"
                        :items="naturalezaItems"
                        item-title="text"
                        item-value="value"
                        />
                    </VCol>


                    <InputCuentaContable
                        ref="inputCuentaContableARef"
                        v-model:cuenta1="cuenta1A"
                        v-model:cuenta2="cuenta2A"
                        v-model:cuenta3="cuenta3A"
                        v-model:cuenta4="cuenta4A"
                        v-model:aplicar-restricciones="aplicarRestricciones"
                        
                        :disabled="tipoCuentaFlag"
                        label-cuenta="Cuenta Inicial"
                        
                        @cuenta-seleccionada="handleCuentaA"
                        
                    />

                    <VCol cols="12" md="5"  >
                        <AppTextField
                            v-model="descripcionCuentaA"
                            label="Descripción Cuenta Inicial"
                            style="margin-top: -3px;"
                            readonly
                        />
                    </VCol>

                    <InputCuentaContable
                        ref="inputCuentaContableBRef"
                        v-model:cuenta1="cuenta1B"
                        v-model:cuenta2="cuenta2B"
                        v-model:cuenta3="cuenta3B"
                        v-model:cuenta4="cuenta4B"
                        v-model:aplicar-restricciones="aplicarRestricciones"
                        
                        :disabled="tipoCuentaFlag"
                        label-cuenta="Cuenta Final"

                        @cuenta-seleccionada="handleCuentaB"
                        
                    />

                    <VCol cols="12" md="5"  >
                        <AppTextField
                            v-model="descripcionCuentaB"
                            label="Descripción Cuenta Final"
                            style="margin-top: -3px;"
                            readonly
                        />
                    </VCol>

                </VRow> 


                <VRow>
                    <VCol cols="12" class="text-overline font-weight-bold">
                        <VDivider class="mt-5 mb-5"/>
                        Cuentas con Movimientos y Saldo de las Cuentas Contables
                    </VCol>
                </VRow>

                <VRow>
                    <VCol cols="12" class="comprimir-col">
                        <VRadioGroup
                            v-model="cuentasCon"
                            density="compact"
                            :disabled="cuentasConMovimientosYSaldos"
                        >
                            <VRadio
                            label="Todas las Cuentas"
                            :value="0"
                            />
                            <VRadio
                            label="Con Movimientos"
                            :value="1"
                            />
                            <VRadio
                            label="Cuentas con Saldo Actual Diferente a Cero"
                            :value="2"
                            />
                            <VRadio
                            label="Cuentas con Movimientos y Saldo Actual Diferente a Cero"
                            :value="3"
                            />
                            <VRadio
                            label="Cuentas con Movimientos o Saldo Actual Diferente a Cero"
                            :value="4"
                            />
                        </VRadioGroup>
                    </VCol>
                </VRow>

                <!-- <VRow>
                    <VCol cols="12" class="d-flex flex-wrap gap-4 justify-end">
                        <VDivider class=" mb-5"/>
                        <VBtn color="primary">
                            <VIcon class="me-2" icon="tabler-printer" />
                            Imprimir
                        </VBtn>

                        <VBtn color="secondary" @click="updateModel(false)">
                            <VIcon class="me-2" icon="tabler-x" />
                            Cancelar
                        </VBtn>
                    </VCol>
                </VRow> -->

            </VForm>
      </VCardText>

      <VCardActions class="justify-end">
        <VBtn color="secondary" @click="updateModel(false)">
          Cancelar
        </VBtn>
        <VBtn color="primary" @click="imprimirReporte()">
          Imprimir
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

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

  <TemporaryMessage
    v-model="temporalModalConfig.visible"
    :title="temporalModalConfig.title"
    :mensaje="temporalModalConfig.mensaje"
    :color="temporalModalConfig.color"
    :timeout="temporalModalConfig.timeout"
  />
</template>