<script setup>
// =================================================================
// 1. IMPORTACIONES Y UTILIDADES
// =================================================================
import { ref, watch, computed, readonly } from 'vue'
import { useTheme } from 'vuetify'
import api from '@/services/api'

// --- Componentes Locales ---
import AccionModal from '@/pages/components/dialogs/accion-modal.vue'
import TemporaryMessage from '@/pages/components/dialogs/mensaje-temporal-dialog.vue'
import InputCuentaContable from '@/pages/components/contabilidad/form-cuenta-contable.vue'


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
const tipoCuentaFlag = ref(false)
const cuentasConMovimientosYSaldos = ref(false)


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

const cuentasCon = ref('todasLasCuentas')


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

for (let year = 2010; year <= currentYear; year++) {
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



// ===================== FLAGS DE ESTADO ===========================

// Flags de estado heredados del flujo contable
const isMovimientoEnCaja = ref(false)
const isPolizaBloqueada = ref(false)


// =================================================================
// 3. LÓGICA DE API Y FUNCIONES CENTRALES
// =================================================================




// =================================================================
// 4. FUNCIONES AUXILIARES DE INTERFAZ
// =================================================================

// Se ejecuta cuando el InputCuentaContable A encuentra o selecciona una cuenta
const handleCuentaA = (data) => {
  descripcionCuentaA.value = data.descripcion
}

// Se ejecuta cuando el InputCuentaContable B encuentra o selecciona una cuenta
const handleCuentaB = (data) => {
  descripcionCuentaB.value = data.descripcion
}

// Ejecutar acción del modal
const ejecutarAccion = () => {
  modalConfig.value.callback()
}


// =================================================================
// 5. WATCHERS
// =================================================================

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
  <div>
    <VRow>
      <VCol cols="12">
        <VCard title="Imprimir Reporte de Movimientos Auxiliares">
          <VCardText>
            <!-- A partir de aqui es el formulario -->
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
                        
                        :disabled="tipoCuentaFlag"
                        
                        @cuenta-seleccionada="handleCuentaA"
                        
                    />

                    <VCol cols="12" md="5"  >
                        <AppTextField
                            v-model="descripcionCuentaA"
                            label="Descripción Cuenta"
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
                        
                        :disabled="tipoCuentaFlag"
                        @cuenta-seleccionada="handleCuentaB"
                        
                    />

                    <VCol cols="12" md="5"  >
                        <AppTextField
                            v-model="descripcionCuentaB"
                            label="Descripción Cuenta"
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
                            value=0
                            />
                            <VRadio
                            label="Con Movimientos"
                            value=1
                            />
                            <VRadio
                            label="Cuentas con Saldo Actual Diferente a Cero"
                            value=2
                            />
                            <VRadio
                            label="Cuentas con Movimientos y Saldo Actual Diferente a Cero"
                            value=3
                            />
                            <VRadio
                            label="Cuentas con Movimientos o Saldo Actual Diferente a Cero"
                            value=4
                            />
                        </VRadioGroup>
                    </VCol>
                </VRow>

                <VRow>
                    <VCol cols="12" class="d-flex flex-wrap gap-4 justify-end">
                        <VDivider class=" mb-5"/>
                        <VBtn color="primary">
                            <VIcon class="me-2" icon="tabler-printer" />
                            Imprimir
                        </VBtn>

                        <VBtn color="secondary" @click="irAInicio">
                            <VIcon class="me-2" icon="tabler-x" />
                            Cancelar
                        </VBtn>
                    </VCol>
                </VRow>

            </VForm>
            <!-- Aqui termina el formulario -->
            </VCardText>
        </VCard>

        
      </VCol>
    </VRow>
    
  </div>


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
    v-model="temporalModalConfig.visible"  :title="temporalModalConfig.title"
    :mensaje="temporalModalConfig.mensaje"
    :color="temporalModalConfig.color"
    :timeout="temporalModalConfig.timeout"
  />


</template>


<style>

.comprimir-col{
  margin-top: -10px; 
  margin-bottom: -10px; 
}


:root {
  --color-mustard-light: #e9c985; 
  --text-color-light: #000000;
}

.v-theme--dark {
  --color-mustard-dark: #a38543; 
  --text-color-dark: #ffffff;
}

</style>


