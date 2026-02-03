<script setup>
import { ref, computed, watch, nextTick } from "vue" // Se añade nextTick para la sincronización de campos
import { useTheme } from 'vuetify';
import { VDataTable } from "vuetify/components"

// --- Importaciones de Componentes (Asumo que están en la ruta) ---
import AppTextField from "@/@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@/@core/components/app-form-elements/AppSelect.vue"
import AccionModal from '@/pages/components/dialogs/accion-modal.vue';
import TemporaryMessage from '@/pages/components/dialogs/mensaje-temporal-dialog.vue';

// --- API Service ---
import api from '@/services/api'


// =================================================================
// 1. IMPORTACIONES Y UTILIDADES
// =================================================================

const theme = useTheme();
// Propiedad computada para determinar el tema actual y aplicar estilos
const isDarkTheme = computed(() => theme.global.name.value === 'dark');


// =================================================================
// 2. PROPS Y EMITS
// =================================================================

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: "Formulario" },
  // Prop que recibe los valores de cuenta del componente padre (administrar-polizas)
  cuentasIniciales: { 
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(["update:modelValue", "submit"])


// =================================================================
// 3. DEFINICIÓN DE ESTADO Y CONSTANTES
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
});


// Mensaje temporal flotante
const temporalModalConfig = ref({
    visible: false,
    title: 'Notificación',
    mensaje: '',
    color: 'info',
    timeout: 3000,
});




// --- Estado del Formulario (Inputs de búsqueda) ---
const grupoUnoDe = ref("")
const grupoDosDe = ref("")
const grupoTresDe = ref("")
const grupoCuatroDe = ref("")
const grupoUnoHasta = ref("")
const grupoDosHasta = ref("")
const grupoTresHasta = ref("")
const grupoCuatroHasta = ref("")
const nombreSCC = ref("")
const tipoSCC = ref(null)
const divisionSCC = ref(null)
const mostrarCuentasSCC = ref('todasLasCuentasSCC')
const ordenarPorSCC = ref('ordenarPorNumeroSCC')

// --- Estado de la Tabla y Paginación ---
const cuentasContables = ref([]) // Datos mostrados en la VDataTable
const totalItems = ref(0)
const currentPage = ref(1); 
const itemsPerPage = 100; // Constante para la paginación de la API
const selectedItem = ref(null); // Fila seleccionada por el usuario

// --- Mensajes y Errores ---
const mostrarMensajeError = ref(false); 
const mensajeError = ref(null); // Contenido del mensaje de error del backend

// --- Control de Modal (Local) ---
// Variable interna que se sincroniza con modelValue para el VDialog
const isOpen = ref(props.modelValue)

const tiposCuenta = [
  { value: null, text: "Seleccione Tipo"},
  { value: 1, text: "ACTIVO DEUDORA" },
  { value: 2, text: "ACTIVO ACREEDORA" },
  { value: 3, text: "PASIVO DEUDORA" },
  { value: 4, text: "PASIVO ACREEDORA" },
  { value: 5, text: "CAPITAL DEUDORA" },
  { value: 6, text: "CAPITAL ACREEDORA" },
  { value: 7, text: "RESULTADOS DEUDORA" },
  { value: 8, text: "RESULTADOS ACREEDORA" },
]

const tiposDivision = [
  { value: null, text: "Seleccione División"},
  { value: 1, text: "Título" },
  { value: 2, text: "Subtítulo" },
  { value: 3, text: "Mayor" },
  { value: 4, text: "Afectable" },
  { value: 5, text: "SubAfectable" },
]

const headersCuentasContables = [
  { title: 'Número', key: 'numTabla', align: 'center', minWidth: '370px'},
  { title: 'Nombre', key: 'nombreTabla', align: 'center'},
  { title: 'Tipo', key: 'tipoTabla', align: 'center'},
  { title: 'División', key: 'divisionTabla', align: 'center'},
]


// =================================================================
// 4. LÓGICA DE API Y FUNCIONES CENTRALES
// =================================================================

/**
 * Realiza la llamada a la API para buscar cuentas contables.
 */
const buscarCuentasContables = async () => {
  try {
    const res = await api.get('/contabilidad/get-cuentas-contables', {
      params: {
        grupoUnoDe: grupoUnoDe.value,
        grupoDosDe: grupoDosDe.value,
        grupoTresDe: grupoTresDe.value,
        grupoCuatroDe: grupoCuatroDe.value,
        grupoUnoHasta: grupoUnoHasta.value,
        grupoDosHasta: grupoDosHasta.value,
        grupoTresHasta: grupoTresHasta.value,
        grupoCuatroHasta: grupoCuatroHasta.value,
        nombreSCC: nombreSCC.value,
        tipoSCC: tipoSCC.value,
        divisionSCC: divisionSCC.value,
        mostrarCuentasSCC: mostrarCuentasSCC.value,
        ordenarPorSCC: ordenarPorSCC.value,
        page: currentPage.value,
        items_per_page: itemsPerPage,
      }
    })

    const data = res.data
    if(data && data.results && data.results.length > 0){
      // Mapeo de la respuesta del backend al formato de la tabla
      cuentasContables.value = data.results.map(c => ({
        numTabla: c.NumeroCuenta,
        nombreTabla: c.Descripcion,
        tipoTabla: c.Tipo,
        divisionTabla: c.Division,
      }))
      totalItems.value = data.total

    } else{
      cuentasContables.value = []
      totalItems.value = 0;
      selectedItem.value = null;
      mostrarMensajeError.value = false
      mensajeError.value = null

      modalConfig.value = {
          visible: true, 
          title: 'Advertencia',
          mensaje: 'No se encontraron cuentas contables con los datos proporcionados',
          color: 'warning',
          confirmText: 'Aceptar',
          showCancelButton: false, 
          callback: () => {}, 
      };
    }
    
  } catch (error) {
    console.error('Error al buscar cuentas contables:', error)
    cuentasContables.value = []
  }
}

/**
 * Valida la cuenta seleccionada con el backend antes de emitir.
*/
const validarSeleccion = async (filaSeleccionada) => {
  mensajeError.value = null; 
  
  try {
    const res = await api.get('/contabilidad/verificar-cuenta-contable', {
      params: { numeroCuenta: filaSeleccionada.numTabla }
    });
    
    const data = res.data;

    if (data.esValida === false) {
      mostrarMensajeError.value = true;
      mensajeError.value = data.mensajeError || "La cuenta contable seleccionada no es válida.";
      return false;
    }
    
    return true;
  } catch (error) {
    mostrarMensajeError.value = true;
    mensajeError.value = "Ocurrió un error de conexión. Intente de nuevo.";
    return false;
  } 
}


// =================================================================
// 5. FUNCIONES AUXILIARES DE INTERFAZ
// =================================================================


// La función que se llama cuando se presiona el boton de confirmar en el modal
const ejecutarAccion = () => {
    modalConfig.value.callback();
};


// Emite el evento para cerrar el modal
function updateModel(val) {
  emit("update:modelValue", val)
}

/**
 * Función para limpiar los campos del formulario.
 * @param {boolean} forzarLimpieza - Si es true, limpia también los campos 'De' 
 * (usados para inicialización).
 */
function resetFields(forzarLimpieza = true) {
  if (forzarLimpieza) {
    // Campos que se inicializan desde el componente padre
    grupoUnoDe.value = ""
    grupoDosDe.value = ""
    grupoTresDe.value = ""
    grupoCuatroDe.value = ""
  }

  // Limpia el resto de los campos de filtro
  grupoUnoHasta.value = ""
  grupoDosHasta.value = ""
  grupoTresHasta.value = ""
  grupoCuatroHasta.value = ""
  nombreSCC.value = ""
  tipoSCC.value = null
  divisionSCC.value = null
  mostrarCuentasSCC.value = 'todasLasCuentasSCC'
  ordenarPorSCC.value = 'ordenarPorNumeroSCC'

  // Limpia la tabla y estado
  cuentasContables.value = [] 
  totalItems.value = 0
  currentPage.value = 1;
  selectedItem.value = null
  mostrarMensajeError.value = false
  mensajeError.value = null
}

// Formatear el número de cuenta con ceros a la derecha (padEnd) hasta 9 dígitos.
function padZerosRightRef(fieldRef) {
  if (!fieldRef.value) {
    fieldRef.value = ""
    return
  }
  fieldRef.value = String(fieldRef.value ?? '').padEnd(9, '0')
  // Asegura que no exceda los 9 caracteres
  fieldRef.value = fieldRef.value.slice(0, 9)
}

// Funciones de Blur para formatear los campos de cuenta
function onBlurGrupoUnoDe(){ 
  grupoUnoDe.value = grupoUnoDe.value.replace(/[^0-9]/g, '')
  padZerosRightRef(grupoUnoDe) 
}
function onBlurGrupoDosDe() { 
  grupoDosDe.value = grupoDosDe.value.replace(/[^0-9]/g, '')
  padZerosRightRef(grupoDosDe) 
}
function onBlurGrupoTresDe() { 
  grupoTresDe.value = grupoTresDe.value.replace(/[^0-9]/g, '')
  padZerosRightRef(grupoTresDe) 
}
function onBlurGrupoCuatroDe() { 
  grupoCuatroDe.value = grupoCuatroDe.value.replace(/[^0-9]/g, '')
  padZerosRightRef(grupoCuatroDe) 
}
function onBlurGrupoUnoHasta() { 
  grupoUnoHasta.value = grupoUnoHasta.value.replace(/[^0-9]/g, '')
  padZerosRightRef(grupoUnoHasta) 
}
function onBlurGrupoDosHasta() { 
  grupoDosHasta.value = grupoDosHasta.value.replace(/[^0-9]/g, '')
  padZerosRightRef(grupoDosHasta) 
}
function onBlurGrupoTresHasta() { 
  grupoTresHasta.value = grupoTresHasta.value.replace(/[^0-9]/g, '')
  padZerosRightRef(grupoTresHasta) 
}
function onBlurGrupoCuatroHasta() { 
  grupoCuatroHasta.value = grupoCuatroHasta.value.replace(/[^0-9]/g, '')
  padZerosRightRef(grupoCuatroHasta) 
}

// Filtrar la entrada para que solo acepte números
const filtrarNumericos = (event) => {
  event.target.value = event.target.value.replace(/[^0-9]/g, '');
};


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



// Paginación: Ir a la página anterior
const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };

// Paginación: Ir a la página siguiente
const nextPage = () => { 
  const totalPages = Math.ceil(totalItems.value / itemsPerPage);
  if (currentPage.value < totalPages) currentPage.value++; 
};

/**
 * Dispara la búsqueda al presionar el botón "Buscar" (manual).
 */
const handleSearch = () => {
  mensajeError.value = null;
  currentPage.value = 1; // Reinicia a la primera página en cada nueva búsqueda
  mostrarMensajeError.value = false; 
  selectedItem.value = null;
  buscarCuentasContables();
};

/**
 * Emite la cuenta seleccionada si pasa la validación y cierra el modal.
 */
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
      numTabla: selectedItem.value.numTabla,
      nombreTabla: selectedItem.value.nombreTabla,
    });
    updateModel(false);
  } 
}


// =================================================================
// 6. WATCHERS Y LÓGICA DE INICIALIZACIÓN
// =================================================================

// Sincronizar isOpen con modelValue (necesario para VDialog)
watch(() => props.modelValue, (val) => {
  isOpen.value = val
})

/**
 * Función central que se ejecuta al abrir/cerrar el modal (modelValue).
 * Maneja la limpieza y la inicialización de los campos 'De' automáticamente.
 */
watch(() => props.modelValue, async (isVisible) => {
  if (isVisible) {
    
    // Comprueba si hay alguna cuenta inicial proporcionada desde la póliza
    const hayCuentasIniciales = Object.values(props.cuentasIniciales).some(val => val);

    // 1. Limpieza condicional: si NO hay cuentas iniciales, limpiar TODO.
    // Si SÍ hay, limpia solo los campos auxiliares (Hasta, Nombre, etc.)
    resetFields(!hayCuentasIniciales);

    // 2. Si hay valores, asignarlos y disparar la búsqueda.
    if (hayCuentasIniciales) {
      // **Uso de nextTick**: Es crucial para asegurar que Vue haya terminado de actualizar 
      // el DOM después de la posible limpieza o renderizado del VDialog/VCardText (v-if).
      await nextTick() 

      // Sincronización de los valores de la prop a las variables locales
      grupoUnoDe.value = props.cuentasIniciales.grupoUnoDe || ''
      grupoDosDe.value = props.cuentasIniciales.grupoDosDe || ''
      grupoTresDe.value = props.cuentasIniciales.grupoTresDe || ''
      grupoCuatroDe.value = props.cuentasIniciales.grupoCuatroDe || ''

      // Disparar la búsqueda automática con los valores
      buscarCuentasContables();
    }
  } else {
    // Al cerrar el modal, siempre limpiar todos los campos (limpieza forzada)
    resetFields(true); 
  }
});

// Observar los cambios en la página actual para disparar la búsqueda de cuentas
watch(currentPage, buscarCuentasContables);
</script>


<template>
  <VDialog
    v-model="isOpen"
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
            <VCol cols="6">
              <label>Número:</label>
              <VRow style="margin-top: 1px;"> 
                <VCol cols="12" md="3" class="comprimir-col">
                  <AppTextField 
                    label="De"
                    v-model="grupoUnoDe" 
                    @blur="onBlurGrupoUnoDe"
                    autofocus
                    @input="filtrarNumericos"
                  />
                </VCol>
                <VCol cols="12" md="3" class="comprimir-col">
                  <AppTextField 
                    v-model="grupoDosDe"
                    class="mt-6"
                    @blur="onBlurGrupoDosDe"
                    @input="filtrarNumericos"
                  />
                </VCol>
                <VCol cols="12" md="3" class="comprimir-col">
                  <AppTextField 
                    v-model="grupoTresDe" 
                    class="mt-6"
                    @blur="onBlurGrupoTresDe"
                    @input="filtrarNumericos"
                  />
                </VCol>
                <VCol cols="12" md="3" class="comprimir-col">
                  <AppTextField 
                    v-model="grupoCuatroDe" 
                    class="mt-6"
                    @blur="onBlurGrupoCuatroDe"
                    @input="filtrarNumericos"
                  />
                </VCol>
              </VRow>
            </VCol>
            <VCol cols="6">
              <label>ㅤ</label>
              <VRow style="margin-top: 1px;">
                <VCol cols="12" md="3" class="comprimir-col">
                  <AppTextField 
                    label="Hasta"
                    v-model="grupoUnoHasta" 
                    @blur="onBlurGrupoUnoHasta"
                    @input="filtrarNumericos"
                  />
                </VCol>
                <VCol cols="12" md="3" class="comprimir-col">
                  <AppTextField 
                    v-model="grupoDosHasta"
                    class="mt-6"
                    @blur="onBlurGrupoDosHasta"
                    @input="filtrarNumericos"
                  />
                </VCol>
                <VCol cols="12" md="3" class="comprimir-col">
                  <AppTextField 
                    v-model="grupoTresHasta"
                    class="mt-6"
                    @blur="onBlurGrupoTresHasta"
                    @input="filtrarNumericos"
                  />
                </VCol>
                <VCol cols="12" md="3" class="comprimir-col">
                  <AppTextField 
                    v-model="grupoCuatroHasta"
                    class="mt-6"
                    @blur="onBlurGrupoCuatroHasta"
                    @input="filtrarNumericos"
                  />
                </VCol>
              </VRow>
            </VCol>
          </VRow>
          <VRow>
            <VCol cols="6">
              <VRow>
                <VCol cols="12" class="comprimir-col">
                  <AppTextField 
                    v-model="nombreSCC" 
                    label="Nombre: "
                  />
                </VCol>
              </VRow>

              <VRow>
                <VCol cols="12" class="comprimir-col">
                  <AppSelect
                    v-model="tipoSCC" 
                    label="Tipo: "
                    :items="tiposCuenta"
                    item-title="text"
                    item-value="value"
                    variant="filled"
                  />
                </VCol>
              </VRow>
              
              <VRow>                  
                <VCol cols="12" class="comprimir-col">
                  <AppSelect
                    v-model="divisionSCC" 
                    label="División: "
                    :items="tiposDivision"
                    item-title="text"
                    item-value="value"
                    variant="filled"
                  />
                </VCol>
              </VRow>
            </VCol>
            
            <VCol cols="6">
              <VRow>
                <VCol cols="12" class="comprimir-col">
                  <label>ㅤ</label>
                  <VRadioGroup
                    v-model="mostrarCuentasSCC"
                    inline
                  >
                    <VRadio
                      label="Todas las Cuentas"
                      value="todasLasCuentasSCC"
                      density="compact"
                    />
                    <VRadio
                      label="Con Movimientos"
                      value="conMovimientosSCC"
                      density="compact"
                    />
                    <VRadio
                      label="Sin Movimientos"
                      value="sinMovimientosSCC"
                      density="compact"
                    />
                  </VRadioGroup>
                </VCol>
              </VRow>

              <VRow>
                <VCol cols="12">
                  <VRadioGroup
                    v-model="ordenarPorSCC"
                    inline
                    label="Ordenar Por"
                  >
                    <VRadio
                      label="Número"
                      value="ordenarPorNumeroSCC"
                      density="compact"
                    />
                    <VRadio
                      label="Nombre"
                      value="ordenarPorNombreSCC"
                      density="compact"
                    />
                  </VRadioGroup>
                </VCol>
              </VRow>

              <VRow>
                <VCol cols="6">
                  <VBtn block color="primary" @click="handleSearch"> 
                    <VIcon class="me-2" icon="tabler-search" tabindex="17" />
                    Buscar
                  </VBtn>
                </VCol>

                <VCol cols="6">
                  <VBtn block color="primary" @click="resetFields">
                    <VIcon class="me-2" icon="tabler-eraser" tabindex="18" />
                    Limpiar
                  </VBtn>
                </VCol>
              </VRow>

            </VCol>
          </VRow>

        </VForm>

        <VDivider class="mt-5 mb-5"></VDivider>

        <VCard>
          <VCardText>
            <VDataTable
              :headers="headersCuentasContables"
              :items="cuentasContables"
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
            <template #item.numTabla="{ item }">
              <div class="text-left">{{ item.raw?.numTabla ?? item.numTabla }}</div>
            </template>

            <template #item.nombreTabla="{ item }">
              <div class="text-left">{{ item.raw?.nombreTabla ?? item.nombreTabla }}</div>
            </template>

            <template #item.tipoTabla="{ item }">
              <div class="text-left">{{ item.raw?.tipoTabla ?? item.tipoTabla }}</div>
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
            <VCol cols="12" md="6">
              <strong>Número:</strong> {{ selectedItem.numTabla }}
            </VCol>
            <VCol cols="12" md="6">
              <strong>Nombre:</strong> {{ selectedItem.nombreTabla }}
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
          {{ mensajeError || 'Por favor, seleccione una cuenta contable para continuar.' }}
        </div>

        <!-- BOTONES -->
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
  max-height: 260px; 
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