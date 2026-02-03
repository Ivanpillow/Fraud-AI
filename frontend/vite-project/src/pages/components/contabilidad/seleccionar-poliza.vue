<script setup>
// =================================================================
// I. IMPORTACIONES DE LIBRERÍAS Y COMPONENTES
// =================================================================
import { ref, computed, watch, nextTick } from "vue" 
import { useTheme } from 'vuetify';
import { VDataTable } from "vuetify/components"

// --- Componentes Compartidos (Inputs y Fecha) ---
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@/@core/components/app-form-elements/AppSelect.vue"
import AppDateTimePicker from "@/@core/components/app-form-elements/AppDateTimePicker.vue";
import AccionModal from '@/pages/components/dialogs/accion-modal.vue';
import TemporaryMessage from '@/pages/components/dialogs/mensaje-temporal-dialog.vue';

// --- Componentes Locales (Hijos) ---
import InputCuentaContable from '@/pages/components/contabilidad/form-cuenta-contable.vue';

// --- API Service ---
import api from '@/services/api'


// =================================================================
// II. CONFIGURACIÓN Y UTILIDADES (Hooks y Refs Globales)
// =================================================================

const theme = useTheme();
// Propiedad computada para determinar el tema actual y aplicar estilos
const isDarkTheme = computed(() => theme.global.name.value === 'dark');

// Referencia al componente hijo InputCuentaContable para llamar a sus métodos
const inputCuentaContableRef = ref(null);

// =================================================================
// III. PROPS, EMITS Y FLAGS DE ESTADO INICIAL
// =================================================================

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: "Formulario" },
  cuentasIniciales: { 
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(["update:modelValue", "submit"])

// Flags de estado del documento (asumidas)
// const isMovimientoEnCaja = ref(false) 
// const isPolizaBloqueada = ref(false)


// =================================================================
// IV. GESTIÓN DE ESTADO (REF's y Variables Reactivas)
// =================================================================
const itemsTipoPoliza = [
  { value: '1', text: 'Ingreso' }, 
  { value: '2', text: 'Egreso' },  
  { value: '3', text: 'Diario' }, 
]

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
});


// Mensaje temporal flotante
const temporalModalConfig = ref({
    visible: false,
    title: 'Notificación',
    mensaje: '',
    color: 'info',
    timeout: 3000,
});



// --- IV.A. Estado del Formulario de Búsqueda (Póliza) ---
const fechaInicialSP = ref(null)
const fechaFinalSP = ref(null)

const viewCargoSP = ref('0.00'); 
const viewAbonoSP = ref('0.00'); 

const cargoSP = ref('0.00');  
const abonoSP = ref('0.00'); 

const cargoNumerical = computed(() => {
    // Si el valor es '0.00', devolvemos null, si no, devolvemos el float limpio.
    const num = getNumericalValue(cargoSP);
    return num === 0 ? null : num;
});
// Retorna el valor numérico para la lógica de la aplicación
const abonoNumerical = computed(() => {
    const num = getNumericalValue(abonoSP);
    return num === 0 ? null : num;
});


const tipoPolizaDiarioSP = ref(true)
const tipoPolizaEgresoSP = ref(true)
const tipoPolizaIngresoSP = ref(true)
const numeroPolizaSP = ref('')
const conceptoPolizaSP = ref('')
const referenciaMovimientoSP = ref('')
const conceptoMovimientoSP = ref('')


// Aplicar restricciones al validar cuenta contable
const aplicarRestricciones = ref(true)

// --- IV.B. Estado de la Cuenta Contable (Data Owner para el Hijo) ---
const cuenta1SP = ref('');
const cuenta2SP = ref('');
const cuenta3SP = ref('');
const cuenta4SP = ref('');
const descripcionCuentaSP = ref(''); // Sincronizada con el campo de descripción visible


// --- IV.C. Estado de la Tabla y Paginación ---
const polizas = ref([]) // Datos mostrados en la VDataTable
const totalItems = ref(0)
const currentPage = ref(1); 
const itemsPerPage = 100;
const selectedItem = ref(null); // Fila seleccionada por el usuario


// --- IV.D. Estado de UI, Modales y Mensajes ---
const mostrarMensajeError = ref(false); 
const mensajeError = ref(null); 
const isOpen = ref(props.modelValue) // Variable interna que se sincroniza con modelValue




// --- IV.E. Constantes y Headers de Tabla ---
const headersPolizas = [
  { title: 'Fecha de la Póliza', key: 'fechaTabla', align: 'center' },
  { title: 'Tipo Póliza', key: 'tipoTabla', align: 'center'},
  { title: 'Número Póliza', key: 'numeroTabla', align: 'center', maxWidth: '100px'},
  { title: 'Concepto de la Póliza', key: 'conceptoTabla', align: 'center', minWidth: '700px' },
]


// =================================================================
// V. MÉTODOS Y HANDLERS
// =================================================================

// --- V.A. Manejo de Comunicación con el Componente Hijo ---

// Se ejecuta cuando el InputCuentaContable encuentra o selecciona una cuenta
const handleCuentaSeleccionadaDesdeHijo = (data) => {
    // Actualiza la descripción en el padre. Esto debería actualizar el AppTextField.
    descripcionCuentaSP.value = data.descripcion; 
};


// --- V.B. Control del Modal Principal ---

// Emite el evento para cerrar el modal
function updateModel(val) {
  emit("update:modelValue", val)
}

// Limpia todos los campos del formulario
function resetFields() {
  // 1. Campos del Padre (Formulario de Búsqueda)
  fechaInicialSP.value = null;
  fechaFinalSP.value = null;
  cargoSP.value = '';
  abonoSP.value = '';
  viewCargoSP.value = '0.00';
  viewAbonoSP.value = '0.00';
  tipoPolizaDiarioSP.value = true;
  tipoPolizaEgresoSP.value = true;
  tipoPolizaIngresoSP.value = true;
  numeroPolizaSP.value = '';
  conceptoPolizaSP.value = '';
  referenciaMovimientoSP.value = '';
  conceptoMovimientoSP.value = '';
  descripcionCuentaSP.value = '';

  // 2. Limpiar tabla y selección
  polizas.value = [];
  totalItems.value = 0;
  currentPage.value = 1;
  selectedItem.value = null;
  mostrarMensajeError.value = false
  mensajeError.value = null

  // 3. Llamar a la función expuesta del componente hijo para limpiar sus campos
    if (inputCuentaContableRef.value) {
        inputCuentaContableRef.value.limpiarCuentas();
    }
}



const seleccionarTodo = (event) => {
  if (event && event.target) {
    const inputElement = event.target.querySelector('input') || event.target;
    
    if (inputElement && typeof inputElement.select === 'function') {
      inputElement.select();
    }
  }
};


// Función para limpiar la entrada y permitir solo números y puntos.
const cleanInput = (value) => {
    return String(value).replace(/[^\d.]/g, ''); 
};


// Asegurarse que solo uno de los campos Cargo o Abono tenga valor
const onCargoInput = () => {
    viewCargoSP.value = cleanInput(viewCargoSP.value);

};

const onAbonoInput = () => {
    viewAbonoSP.value = cleanInput(viewAbonoSP.value);

};


const onBlurCargo = () => {
    const numericalValue = getNumericalValue(viewCargoSP); 
    cargoSP.value = numericalValue;
    
    viewCargoSP.value = formatAsCurrency(numericalValue);
};

const onBlurAbono = () => {
    const numericalValue = getNumericalValue(viewAbonoSP); 
    abonoSP.value = numericalValue;
    
    viewAbonoSP.value = formatAsCurrency(numericalValue);
};

const getNumericalValue = (inputRef) => {
    // Verificar si la referencia existe y si tiene un valor
    if (!inputRef || inputRef.value === null || inputRef.value === undefined) {
        return 0;
    }
    
    // Convertir el valor de la referencia a string
    const strValue = String(inputRef.value);

    // Remover la coma
    const cleanStr = strValue.replace(/,/g, ''); 

    // Devolver el número, o 0 si no es válido
    return parseFloat(cleanStr) || 0;
};

const formatAsCurrency = (value) => {
    // Asegurarse de que el valor sea un número y usar el formato local de moneda con 2 decimales
    const numValue = parseFloat(value) || 0;
    return numValue.toLocaleString("es-MX", { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 10 
    });
};

// La función que se llama cuando se presiona el boton de confirmar en el modal
const ejecutarAccion = () => {
    modalConfig.value.callback();
};





// --- V.C. Lógica de Búsqueda y Selección ---
const fechaFormatoSQL = (dateString) => {
  if (!dateString) {
    return null;
  }

  const parts = dateString.split('/');

  if (parts.length === 3) {
    const day = parts[0];   
    const month = parts[1]; 
    const year = parts[2];  

    return `${year}-${month}-${day}`;
  }

  return null;
};



const formatSQLDateToDDMMYYYY = (isoTimestamp) => {
  if (!isoTimestamp) {
    return '';
  }

  // 1. Extrae solo la parte de la fecha
  // Ya que lo regresa en un formato como '2025-11-13T22:46:32.777000'
  const datePart = isoTimestamp.split('T')[0];

  // 2. Divide la fecha en sus componentes (año, mes, día)
  const [year, month, day] = datePart.split('-');

  // 3. Reordena al formato DD-MM-YYYY
  return `${day}/${month}/${year}`;
};


// Función placeholder para la búsqueda de pólizas
const handleSearch = async () => {
  mensajeError.value = null;
  currentPage.value = 1; // Reinicia a la primera página en cada nueva búsqueda
  mostrarMensajeError.value = false; 
  selectedItem.value = null;
  buscarPolizas(true);
}

const buscarPolizas = async (esNuevaBusqueda) => {
  try{
    const res = await api.get('/contabilidad/seleccionar-poliza', {
        params: {
            fechaInicial: fechaFormatoSQL(fechaInicialSP.value),
            fechaFinal: fechaFormatoSQL(fechaFinalSP.value),
            cargo: cargoNumerical.value,
            abono: abonoNumerical.value,
            tipoPolizaDiario: tipoPolizaDiarioSP.value,
            tipoPolizaEgreso: tipoPolizaEgresoSP.value,
            tipoPolizaIngreso: tipoPolizaIngresoSP.value,
            numeroPoliza: numeroPolizaSP.value,
            conceptoPoliza: conceptoPolizaSP.value,
            referenciaMovimiento: referenciaMovimientoSP.value,
            conceptoMovimiento: conceptoMovimientoSP.value,
            cuenta1: cuenta1SP.value,
            cuenta2: cuenta2SP.value,
            cuenta3: cuenta3SP.value,
            cuenta4: cuenta4SP.value,
            descripcionCuenta: descripcionCuentaSP.value,
            esNuevaBusqueda: esNuevaBusqueda,
            page: currentPage.value,
            items_per_page: itemsPerPage.value
        }
    })

                                              
    const data = res.data;
    if(data && data.results && data.results.length > 0){
      // Mapeo de la respuesta del backend al formato de la tabla
      polizas.value = data.results.map(p => ({
        fechaTabla: formatSQLDateToDDMMYYYY(p.fecha),
        tipoTabla: itemsTipoPoliza.find(item => item.value === String(p.tipo))?.text || p.tipo,
        numeroTabla: p.numero,
        conceptoTabla: p.concepto,
        periodoMes: p.mes,
        periodoAnio: p.anio,
        tipoValor: p.tipo
      }))

      if(data.total_items > 0){
        totalItems.value = data.total_items;
      } 

    } else{
      polizas.value = []
      totalItems.value = 0;
      selectedItem.value = null;
      mostrarMensajeError.value = false
      mensajeError.value = null

      modalConfig.value = {
          visible: true, 
          title: 'Advertencia',
          mensaje: 'No se encontraron pólizas con los datos proporcionados',
          color: 'warning',
          confirmText: 'Aceptar',
          showCancelButton: false, 
          callback: () => {}, 
      };
    }

} catch (error) {
    console.error("Error during search:", error);
  }
  
}

// Función placeholder para la validación
const validarSeleccion = (item) => {
  // console.log("Validasndo selección...", item);
  return true; 
}

// Finaliza el proceso y emite el item seleccionado
const emitSeleccionar = async () => {
  if (!selectedItem.value) {
    mostrarMensajeError.value = true;
    mensajeError.value = null; 
    return;
  }

  mostrarMensajeError.value = false; 
  const esValida = await validarSeleccion(selectedItem.value); 
  
  if (esValida) {
    emit("submit", {
      periodoMes: selectedItem.value.periodoMes,
      periodoAnio: selectedItem.value.periodoAnio,
      tipo: selectedItem.value.tipoValor,
      consecutivo: selectedItem.value.numeroTabla,
    });
    updateModel(false);
  } 
}


// --- V.D. Funciones de Tabla y Paginación ---

const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
const nextPage = () => { if (currentPage.value < Math.ceil(totalItems.value / itemsPerPage)) currentPage.value++; };

// Función para manejar la selección de una fila en la tabla
const selectRow = (event, { item }) => {
  selectedItem.value = item;
  mostrarMensajeError.value = false;
  mensajeError.value = null; 
};


// Doble clic para seleccionar rápidamente
const onRowDblClick = async (event, { item }) => {
  selectedItem.value = item
  mostrarMensajeError.value = false
  mensajeError.value = null

  await emitSeleccionar()
}


// =================================================================
// VI. OBSERVADORES (WATCHERS)
// =================================================================

// Sincronizar isOpen con modelValue y resetear el formulario al abrir
watch(() => props.modelValue, (val) => {
  isOpen.value = val;
  if(val) {
    nextTick(resetFields);
  }
});

// Observar los cambios en la página actual para disparar la búsqueda de cuentas
watch(currentPage, () => {
  buscarPolizas(false);
});




</script>


<template>
  <VDialog
    v-model="isOpen"
    :retain-focus="false"
    :model-value="modelValue"
    @update:model-value="updateModel"
    max-width="1200px"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex justify-space-between">
        <span>{{ title }}</span>
        <VBtn icon="tabler-x" @click="updateModel(false)" variant="text"></VBtn>
      </VCardTitle>

      <VCardText v-if="modelValue">
        <VForm>
            <VRow>
                <VCol cols="12" md="6">
                    <VRow style="margin-top: 1px;">
                        <VCol cols="12" md="6" class="comprimir-col">
                        <AppDateTimePicker
                            v-model="fechaInicialSP"
                            label="Fecha de la Póliza Inicial"
                            placeholder="Seleccione la fecha"   
                        />
                        </VCol>
                        <VCol cols="12" md="6" class="comprimir-col">
                        <AppDateTimePicker
                            v-model="fechaFinalSP"
                            label="Fecha de la Póliza Final"
                            placeholder="Seleccione la fecha"
                        />
                        </VCol>
                    </VRow>
                </VCol>
                <VCol cols="12" md="6">
                    <VRow style="margin-top: 1px;">
                        <VCol cols="12" md="6" class="comprimir-col">
                            <AppTextField
                              v-model="viewCargoSP"
                              label="Cargo"
                              @input="onCargoInput"
                              @focus="seleccionarTodo" 
                              @blur="onBlurCargo"
                            >
                              <template #prepend-inner>
                                <span class="text-medium-emphasis me-1">$</span> 
                              </template>
                            </AppTextField>
                        </VCol>
                        <VCol cols="12" md="6" class="comprimir-col">
                            <AppTextField
                              v-model="viewAbonoSP"
                              label="Abono"
                              @input="onAbonoInput"
                              @focus="seleccionarTodo"
                              @blur="onBlurAbono"
                            >
                              <template #prepend-inner>
                                <span class="text-medium-emphasis me-1">$</span> 
                              </template>
                            </AppTextField>
                        </VCol>
                    </VRow>
                </VCol>
          </VRow>
          <VRow>
            <VCol cols="12" md="4">
                <VRow>
                    <VCol cols="4" md="4" class="comprimir-col">
                    <label for="tipoPolizaDiarioSP">Tipo de Poliza</label>
                        <VCheckbox
                            v-model="tipoPolizaDiarioSP"
                            label="Diario"
                            density="compact"
                        />
                    </VCol>
                    <VCol cols="4" md="4" class="comprimir-col">
                    <label for="tipoPolizaEgresoSP">ㅤ</label>
                        <VCheckbox
                            v-model="tipoPolizaEgresoSP"
                            label="Egreso"
                            density="compact"
                            style="font-size: 4px !important;"
                        />
                    </VCol>
                    <VCol cols="4" md="4" class="comprimir-col">
                    <label for="tipoPolizaIngresoSP">ㅤ</label>
                        <VCheckbox
                            v-model="tipoPolizaIngresoSP"
                            label="Ingreso"
                            density="compact"
                        />
                    </VCol>
                </VRow>
            </VCol>
            <VCol cols="12" md="8">
                <VRow>
                    <VCol cols="12" md="4" class="comprimir-col">
                        <AppTextField
                            v-model="numeroPolizaSP"
                            label="Número de Póliza"
                        />
                    </VCol>
                    <VCol cols="12" md="8" class="comprimir-col">
                        <AppTextField
                            v-model="conceptoPolizaSP"
                            label="Concepto de Póliza"
                        />
                    </VCol>
                </VRow>
            </VCol>
            
          </VRow>

          <VRow>
            <VCol cols="12" md="7" class="comprimir-col">
                <AppTextField
                    v-model="referenciaMovimientoSP"
                    label="Referencia del Movimiento"
                />
            </VCol>
            <VCol cols="12" md="5" class="comprimir-col">
                <AppTextField
                    v-model="conceptoMovimientoSP"
                    label="Concepto del Movimiento"
                />
            </VCol>
          </VRow>

          <VRow>
            <InputCuentaContable
                ref="inputCuentaContableRef"
                v-model:cuenta1="cuenta1SP"
                v-model:cuenta2="cuenta2SP"
                v-model:cuenta3="cuenta3SP"
                v-model:cuenta4="cuenta4SP"
                v-model:aplicar-restricciones="aplicarRestricciones"
                
                
                
                @cuenta-seleccionada="handleCuentaSeleccionadaDesdeHijo"
                
            />

            <VCol cols="12" md="5"  >
                <AppTextField
                    v-model="descripcionCuentaSP"
                    label="Descripción Cuenta"
                    style="margin-top: -3px;"
                />
            </VCol>
          </VRow>
          <VRow class="d-flex justify-end mt-6">
            <VCol cols="12" md="3">
                <VBtn block color="primary" @click="handleSearch"> 
                    <VIcon class="me-2" icon="tabler-search" tabindex="17" />
                    Buscar
                </VBtn>
            </VCol>
            <VCol cols="12" md="3">
                <VBtn block color="primary" @click="resetFields">
                    <VIcon class="me-2" icon="tabler-eraser" tabindex="18" />
                    Limpiar
                </VBtn>
            </VCol>
          </VRow>

        </VForm>

        <VDivider class="mt-5 mb-5"></VDivider>
        

        <VCard>
          <VCardText>
            <VDataTable
              :headers="headersPolizas"
              :items="polizas"
              disable-pagination
              hide-default-footer
              class="scrollable-table"
              style="font-size: 14px; "
              :items-per-page="itemsPerPage"
              @click:row="selectRow"
              @dblclick:row="onRowDblClick"
              single-select
              return-object
              v-model:selected="selectedItem"
              item-key="numTabla"
              fixed-header
              hover
              density="compact"
              item-selectable
              selectable
              
            >

            <template #item.tipoTabla="{ item }">
              <div class="text-left">{{ item.raw?.tipoTabla ?? item.tipoTabla }}</div>
            </template>

            <template #item.numeroTabla="{ item }">
              <div class="text-right">{{ item.raw?.numeroTabla ?? item.numeroTabla }}</div>
            </template>

            <template #item.conceptoTabla="{ item }">
              <div class="text-left">{{ item.raw?.conceptoTabla ?? item.conceptoTabla }}</div>
            </template>

            <template #no-data>
                No se encontraron registros que coincidan
              </template>
            </VDataTable>


            <div class="d-flex justify-center my-4" v-if="totalItems > itemsPerPage">
              <VBtn 
                @click="prevPage" 
                :disabled="currentPage === 1" 
                class="mx-5"
              >
                Anterior
              </VBtn>
              <span style="display: flex; align-items: center;">Página {{ currentPage }} de {{ Math.ceil(totalItems / itemsPerPage) }}</span>
              <VBtn 
                @click="nextPage" 
                :disabled="currentPage === Math.ceil(totalItems / itemsPerPage)" 
                class="mx-5"
              >
                Siguiente
              </VBtn>
            </div>
          </VCardText>
        </VCard>
      </VCardText>

      <VCardActions class="d-flex align-center">
        <!-- MENSAJE OK -->
        <div 
          v-if="selectedItem" 
          class="flex-grow-1 mx-2 pa-2 rounded-lg text-caption"
          :style="{
            backgroundColor: isDarkTheme ? 'var(--color-success-dark)' : 'var(--color-success-light)',
            border: isDarkTheme
              ? '1px solid var(--color-success-border-dark)'
              : '1px solid var(--color-success-border-light)',
            color: isDarkTheme ? 'var(--text-color-dark)' : 'var(--text-color-light)'
          }"
        >
          <VRow no-gutters>
            <VCol cols="12" md="2">
              <strong>Fecha:</strong> {{ selectedItem.fechaTabla }}
            </VCol>
            <VCol cols="12" md="2">
              <strong>Número Póliza:</strong> {{ selectedItem.numeroTabla }}
            </VCol>
            <VCol cols="12" md="8">
              <strong>Concepto Póliza:</strong> {{ selectedItem.conceptoTabla }}
            </VCol>
          </VRow>
        </div>

        <!-- MENSAJE ERROR -->
        <div 
          v-else-if="mostrarMensajeError" 
          class="flex-grow-1 mx-2 pa-2 rounded-lg"
          :style="{
            backgroundColor: isDarkTheme ? 'var(--color-error-dark)' : 'var(--color-error-light)',
            border: isDarkTheme
              ? '1px solid var(--color-error-border-dark)'
              : '1px solid var(--color-error-border-light)',
            color: isDarkTheme ? 'var(--text-color-dark)' : 'var(--text-color-light)'
          }"
        >
          {{ mensajeError || 'Por favor, seleccione una póliza para continuar.' }}

        <!-- BOTONES -->
        </div>
        <VBtn color="secondary" class="ms-2" @click="updateModel(false)">
          Cancelar
        </VBtn>
        <VBtn color="primary" class="ms-2" @click="emitSeleccionar">
          Seleccionar
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



.scrollable-table {
  max-height: 200px; 
  overflow-y: auto;
}

:root {
  --color-success-light: #e0f2f1; /* Verde claro */
  --color-success-border-light: #00796b; /* Borde verde oscuro */
  --color-error-light: #ffebee; /* Rojo claro */
  --color-error-border-light: #ef5350; /* Borde rojo oscuro */
  --text-color-light: #000000; /* Texto negro */
}

/* Colores para el tema oscuro */
.v-theme--dark {
  --color-success-dark: #1b5e20; /* Verde más oscuro */
  --color-success-border-dark: #4caf50; /* Borde verde claro */
  --color-error-dark: #9e3d3d; /* Rojo más oscuro */
  --color-error-border-dark: #ef5350; /* Borde rojo claro */
  --text-color-dark: #ffffff; /* Texto blanco */
}


</style>