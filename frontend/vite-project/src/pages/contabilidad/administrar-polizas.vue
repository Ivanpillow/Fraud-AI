<script setup>
// =================================================================
// 1. IMPORTACIONES Y UTILIDADES
// =================================================================

// ====================== Importaciones ============================
import { ref, watch, computed, readonly } from 'vue'
import { useTheme } from 'vuetify';
import { useUiPermissions } from '@/composables/useUiPermissions'
import SeleccionarCuentaContable from "@/pages/components/contabilidad/seleccionar-cuenta-contable.vue"
import SeleccionarPoliza from "@/pages/components/contabilidad/seleccionar-poliza.vue"
import AccionModal from '@/pages/components/dialogs/accion-modal.vue';
import TemporaryMessage from '@/pages/components/dialogs/mensaje-temporal-dialog.vue';
import { useRouter } from 'vue-router';
import { generarPDFPoliza, generarExcelPoliza } from '@/pages/utils/imprimir-poliza';
import { useAuth } from '@/composables/useAuth'
import api from '@/services/api'


// ===================== Utilidades ==============================
const { user } = useAuth()
const router = useRouter();
const theme = useTheme();
const isDarkTheme = computed(() => theme.global.name.value === 'dark');
const { getUserRole } = useUiPermissions(); // Importar la función getUserRole para obtener el rol del usuario
const { hasPermission, hasRole } = useUiPermissions()


// =================================================================
// 2. DEFINICIÓN DE ESTADO Y CONSTANTES
// =================================================================


// ===================== VENTANAS FLOTANTES ========================
// Ventana swal de Cuentas Contables y Polizas
const modalVisible = ref(false)
const modalSeleccionarPolizaVisible = ref(false)

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


// ===================== CAMPOS DE PÓLIZA ===========================
const fecha = ref(new Date())
const periodo = ref(fecha.value.getMonth() + 1) 
const yearContable = ref(fecha.value.getFullYear())
const tipoPoliza = ref(null)
const numeroPoliza = ref('')
const concepto = ref('')

const polizaBloqueada = ref(false)
const ultimaModificacion = ref(null)
const isPolizaBloqueada = ref(true)
const hasChequeLiquidacion = ref(false)
const hasChequeLiquidacionCancelado = ref(false)
const hasSolicitudCargo = ref(false)
const hasSolicitudCargoCancelado = ref(false)

const siguienteConsecutivo = ref(1)
const idPoliza = ref(null)

// Campos para la tabla de movimientos
const movimientos = ref([])

// Variables para copiar polizas y movimientos
const isCopiaPoliza = ref(false)



// ===================== CAMPOS DE MOVIMIENTOS DE PÓLIZA ===========================
const movimientoMovPoliza = ref(1)
const posicionMovPoliza = ref(1)
const isNuevoMovimiento = ref(false)
const fijarReferenciaConceptoMovPoliza = ref(false)
const fijarCuentaMovPoliza = ref(false)
const cuenta1MovPoliza = ref('')
const cuenta2MovPoliza = ref('')
const cuenta3MovPoliza = ref('')
const cuenta4MovPoliza = ref('')
const descripcionMovPoliza = ref('')
const cargoMovPoliza = ref('')
const abonoMovPoliza = ref('')
const viewCargoMovPoliza = ref('0.00'); 
const viewAbonoMovPoliza = ref('0.00'); 
const periodoLiqMovPoliza = ref(0)
const ejercicioLiqMovPoliza = ref('')
const aLiquidarMovPoliza = ref(false)
const facturadoMovPoliza = ref(false)
const esImpuestoMovPoliza = ref(false)
const esSeguroMovPoliza = ref(false)
const esRentaMovPoliza = ref(false)
const esAutomaticoMovPoliza = ref(false)
const referenciaMovPoliza = ref('')
const conceptoMovPoliza = ref('')

const existeIdLiquidacion = ref(null)
const liqSeleccionado = ref(null)
const isMovimientoEnCaja = ref(false)
const validacionMovimientoEsModificable = ref(true)
const isMovimientoEnEdicion = ref(false)


// ===================== CÁLCULO DE TOTALES ===========================
const totales = computed(() => {
    // ID temporal (num) del movimiento que se está cargando/editando en el formulario
    const numActual = parseInt(movimientoMovPoliza.value) || 0; 
    
    // Filtrar los movimientos: Excluir el que está actualmente en el formulario (si existe)
    const movimientosFiltrados = movimientos.value.filter(mov => mov.num !== numActual);

    // Calcular los totales de la tabla SIN el movimiento editado
    const totalCargoTabla = movimientosFiltrados.reduce((sum, mov) => sum + (parseFloat(mov.cargo) || 0), 0);
    const totalAbonoTabla = movimientosFiltrados.reduce((sum, mov) => sum + (parseFloat(mov.abono) || 0), 0);

    // Obtener el valor de los inputs del formulario (el nuevo valor que el usuario está escribiendo)
    const cargoInput = getNumericalValue(viewCargoMovPoliza) || 0;
    const abonoInput = getNumericalValue(viewAbonoMovPoliza) || 0;

    // Calcular los totales finales: (Tabla Sin Item) + (Input Actual)
    const totalCargoFinal = totalCargoTabla + cargoInput;
    const totalAbonoFinal = totalAbonoTabla + abonoInput;

    // Este objeto se recalcula automáticamente si cualquier dependencia cambia.
    return {
        TotalCargo: totalCargoFinal,
        TotalAbono: totalAbonoFinal,
        Diferencia: totalCargoFinal - totalAbonoFinal,
    };
});


// Objeto para agrupar las cuentas que se pasarán al modal
const cuentasParaModal = ref({
  grupoUnoDe: '',
  grupoDosDe: '',
  grupoTresDe: '',
  grupoCuatroDe: ''
})

const meses = [
  { value: 1, text: 'Ene' },
  { value: 2, text: 'Feb' },
  { value: 3, text: 'Mar' },
  { value: 4, text: 'Abr' },
  { value: 5, text: 'May' },
  { value: 6, text: 'Jun' },
  { value: 7, text: 'Jul' },
  { value: 8, text: 'Ago' },
  { value: 9, text: 'Sep' },
  { value: 10, text: 'Oct' },
  { value: 11, text: 'Nov' },
  { value: 12, text: 'Dic' },
]

const itemsTipoPoliza = [
  { value: null, text: 'Seleccionar Tipo Póliza', disabled: true },
  { value: '1', text: 'Ingreso' },
  { value: '2', text: 'Egreso' },
  { value: '3', text: 'Diario' },
]

// Tabla Movimientos
const headersMovimientos = [
  { title: 'No.', key: 'num', align: 'center'},
  { title: 'Cuenta', key: 'cuenta', minWidth: '360px', align: 'center', sortable: false },
  { title: 'Descripción', key: 'descripcion', sortable: false, align: 'center' },
  { title: 'Referencia', key: 'referencia', sortable: false, align: 'center' },
  { title: 'Concepto', key: 'concepto', sortable: false, align: 'center' },
  { title: 'Periodo Liq', key: 'periodoLiq', sortable: false, align: 'center' },
  { title: 'Ejercicio Liq', key: 'ejercicioLiq', align: 'center', sortable: false },
  { title: 'Cargo', key: 'cargo', align: 'center', sortable: false },
  { title: 'Abono', key: 'abono', align: 'center', sortable: false },
  { title: 'Liq', key: 'liq', align: 'center', sortable: false },
]

const mesesMovPoliza = [
  { value: 0, text: ''},
  { value: 1, text: 'ENERO' },
  { value: 2, text: 'FEBRERO' },
  { value: 3, text: 'MARZO' },
  { value: 4, text: 'ABRIL' },
  { value: 5, text: 'MAYO' },
  { value: 6, text: 'JUNIO' },
  { value: 7, text: 'JULIO' },
  { value: 8, text: 'AGOSTO' },
  { value: 9, text: 'SEPTIEMBRE' },
  { value: 10, text: 'OCTUBRE' },
  { value: 11, text: 'NOVIEMBRE' },
  { value: 12, text: 'DICIEMBRE' },
]
 
const yearMovPoliza = ref([]);




// =================================================================
// 3. LÓGICA DE API Y FUNCIONES CENTRALES
// =================================================================

// Obtener el siguiente consecutivo
const obtenerSiguienteConsecutivo = async (despuesNuevaPoliza) => {
    isMovimientoEnEdicion.value = false
    if (!periodo.value || !yearContable.value || !tipoPoliza.value) return

    ultimaModificacion.value = ""
    isPolizaBloqueada.value = false

    try {
      const res = await api.get("/contabilidad/administrar-polizas/poliza/siguiente-consecutivo", {
        params: {
          mes: periodo.value,
          year: yearContable.value,
          tipo: tipoPoliza.value,
      }
    })

      siguienteConsecutivo.value = res.data.consecutivo || 1

      if(!despuesNuevaPoliza){
        numeroPoliza.value = res.data.consecutivo || 1
      }
      
      

    } catch (error) {
      modalConfig.value = {
          visible: true, 
          title: 'Error Interno de la Aplicación',
          mensaje: 'Ocurrió un error al obtener el siguiente consecutivo.',
          color: 'error',
          confirmText: 'Aceptar',
          showCancelButton: false, 
          callback: () => {}, 
      };
    }
  


}


// Consultar movimientos de póliza
const movimientosConsultar = async (mes, year, tipo, numero, botonConsultar, direccion = 0) => {

  const callbackConsultarMovimientos = async () => {
    isMovimientoEnEdicion.value = false
    isCopiaPoliza.value = false
    hasChequeLiquidacion.value = false
    hasChequeLiquidacionCancelado.value = false
    hasSolicitudCargo.value = false
    hasSolicitudCargoCancelado.value = false
    liqSeleccionado.value = 'Id. Liquidación'

    // movimientos.value = [] // Limpiar movimientos antes de cargar nuevos
    // console.log("Consultando movimientos con:", { mes, year, tipo, numero})
    if(!mes || mes < 1 || mes > 12){
      modalConfig.value = {
          visible: true, 
          title: 'Advertencia',
          mensaje: 'El campo *Periodo* es obligatorio para consultar movimientos.',
          color: 'warning',
          confirmText: 'Aceptar',
          showCancelButton: false, 
          callback: () => {}, 
      };
      return
    }

    if(!year || year <= 0 || isNaN(parseInt(year))){
      modalConfig.value = {
          visible: true, 
          title: 'Advertencia',
          mensaje: 'El campo *Año Contable* es obligatorio para consultar movimientos.',
          color: 'warning',
          confirmText: 'Aceptar',
          showCancelButton: false, 
          callback: () => {}, 
      };
      return
    }

    if(!tipo || tipo < 1 || tipo > 3){
      modalConfig.value = {
          visible: true, 
          title: 'Advertencia',
          mensaje: 'El campo *Tipo de Póliza* es obligatorio para consultar movimientos.',
          color: 'warning',
          confirmText: 'Aceptar',
          showCancelButton: false, 
          callback: () => {}, 
      };
      return
    }

    // const isAdminSuperior = hasRole('303B3E0A-FB7A-4E6C-9757-E33E6FD8D265') ? 1 : 0
    try {
      const res = await api.get("/contabilidad/administrar-polizas/movimientos/consultar", {
        params: {
          mes: mes,
          year: year,
          tipo: tipo,
          numero: numero,
          // isAdminSuperior: isAdminSuperior
        }
      })
      const resultado = res.data

      if(resultado){

        const datos = resultado.datos || []

        if(resultado.color && resultado.color !== 'success' && direccion === 0){
          modalConfig.value = {
              visible: true, 
              title: resultado.title || 'Advertencia',
              mensaje: resultado.mensaje || 'Ocurrió un problema al consultar los movimientos de la póliza.',
              color: resultado.color || 'warning',
              confirmText: 'Aceptar',
              showCancelButton: false, 
              callback: () => {}, 
          }
          return
        } else if(resultado.color && resultado.color !== 'success' && datos.length === 0 && direccion !== 0){
          // Caso de búsqueda en dirección (siguiente/anterior) sin datos
          
          const nuevoNumero = numero + direccion;
          
          const esBusquedaValida = (direccion === 1 && (nuevoNumero <= (siguienteConsecutivo.value - 1) || (siguienteConsecutivo.value - 1) === 0)) || (direccion === -1 && nuevoNumero >= 1);

          if (esBusquedaValida) {
              movimientosConsultar(mes, year, tipo, nuevoNumero, direccion);
              
              numeroPoliza.value = nuevoNumero;
              
              return 
          } else {
              modalConfig.value = {
                  visible: true, 
                  title: 'Advertencia',
                  mensaje: `No se encontraron más pólizas con movimientos en esta dirección.`,
                  color: 'warning',
                  confirmText: 'Aceptar',
                  showCancelButton: false, 
                  callback: () => {
                      if (direccion === -1) numeroPoliza.value = 1;
                      if (direccion === 1 && (siguienteConsecutivo.value - 1) > 0) numeroPoliza.value = (siguienteConsecutivo.value - 1);
                  }, 
              };
          }
        }

        // const resumenTotales = res.data.totales || { TotalCargo: 0, TotalAbono: 0, Diferencia: 0 }

        idPoliza.value = datos[0].IdPoliza || null

        //Guardar si la poliza esta bloqueada o no
        const resultPolizaBloqueada = resultado.estatusPoliza
        // console.log("Poliza bloqueada?: ", resultPolizaBloqueada)

        if(resultPolizaBloqueada == 1){
          polizaBloqueada.value = false
          isPolizaBloqueada.value = false
        } else if(resultPolizaBloqueada == 2 || resultPolizaBloqueada == 3){
          polizaBloqueada.value = true
          isPolizaBloqueada.value = true
        } else{
          // temporalModalConfig.value = {
          //     visible: true, // Abre el modal
          //     title: 'Advertencia',
          //     mensaje: 'No se pudo determinar si la póliza está bloqueada.',
          //     color: 'warning',
          //     timeout: 3000, 
          // };
          isPolizaBloqueada.value = false
          polizaBloqueada.value = false
        }

        // Guardar la última modificación
        const usuarioModificacion = resultado.usuarioModificacion
        if (usuarioModificacion) {
          const nombreCompleto = `${usuarioModificacion.Nombre} ${usuarioModificacion.Paterno}`
          const fechaModificacion = new Date(usuarioModificacion.FechaModificacion)
          const fechaFormateada = fechaModificacion.toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })

          ultimaModificacion.value = `Última modificación por ${nombreCompleto} el ${fechaFormateada}`
        } else {
          ultimaModificacion.value = 'Sin modificaciones'
        }


        // Si hay datos, asignar el ConceptoPoliza al textarea
        if (datos.length) {
          concepto.value = datos[0].ConceptoPoliza || ""
          nuevoMovPoliza(1)
        } else {
          concepto.value = ""
        }

        const hayMovimientosCaja = resultado.hayMovimientosCaja || false

        // console.log("Caja:", hayMovimientosCaja)

        if(hayMovimientosCaja){

          modalConfig.value = {
              visible: true, 
              title: 'Advertencia',
              mensaje: 'La Póliza tiene algunos movimientos relacionados a Pagos en Caja, no todos se pueden modificar',
              color: 'warning',
              confirmText: 'Aceptar',
              showCancelButton: false, 
              callback: () => {}, 
          };
        }

        const isRelacionadaChequeLiquidacion = resultado.isRelacionadaChequeLiquidacion || false

        if(isRelacionadaChequeLiquidacion){
          hasChequeLiquidacion.value = true
          modalConfig.value = {
              visible: true, 
              title: 'Advertencia',
              mensaje: 'La Póliza no se puede modificar porque tiene un Cheque de Liquidación Relacionado.',
              color: 'warning',
              confirmText: 'Aceptar',
              showCancelButton: false, 
              callback: () => {}, 
          };
        } else{
          hasChequeLiquidacion.value = false
        }

        const isRelacionadaChequeCancelado = resultado.isRelacionadaChequeCancelado || false

        if(isRelacionadaChequeCancelado){
          hasChequeLiquidacionCancelado.value = true
          modalConfig.value = {
              visible: true, 
              title: 'Advertencia',
              mensaje: 'La Póliza no se puede modificar porque tiene un Cheque de Liquidación Relacionado.',
              color: 'warning',
              confirmText: 'Aceptar',
              showCancelButton: false, 
              callback: () => {}, 
          };
        } else{
          hasChequeLiquidacionCancelado.value = false
        }

        const isCargoRelacionado = resultado.isCargoRelacionado || false
        const isCargoRelacionadoCancelado = resultado.isCargoRelacionadoCancelado || false
        const datosCargo = resultado.datosCargo || null

        if(isCargoRelacionado && datosCargo){
          hasSolicitudCargo.value = true
          let FolioSolicitud = datosCargo.FolioSolicitud || ''
          let Periodo = datosCargo.Periodo || ''
          let Ejercicio = datosCargo.Ejercicio || ''

          Periodo = meses.find(x => x.value === datosCargo.Periodo)?.text || datosCargo.Periodo

          hasSolicitudCargo.value = true
          modalConfig.value = {
              visible: true, 
              title: 'Advertencia',
              mensaje: 'La Póliza tiene una Solicitud de Cargo Relacionado con el Folio Solicitud: ' + FolioSolicitud + ', Periodo: ' + Periodo + ', Ejercicio: ' + Ejercicio,
              color: 'warning',
              confirmText: 'Aceptar',
              showCancelButton: false, 
              callback: () => {}, 
          };

        } else{
          hasSolicitudCargo.value = false
        }

        if(isCargoRelacionadoCancelado && datosCargo){
          hasSolicitudCargoCancelado.value = true
          
          let FolioSolicitud = datosCargo.FolioSolicitud || ''
          let Periodo = datosCargo.Periodo || ''
          let Ejercicio = datosCargo.Ejercicio || ''
          Periodo = meses.find(x => x.value === datosCargo.Periodo)?.text || datosCargo.Periodo

          hasSolicitudCargoCancelado.value = true
          modalConfig.value = {
              visible: true, 
              title: 'Advertencia',
              mensaje: 'La Póliza tiene una Solicitud de Cargo Cancelado Relacionado con el Folio Solicitud: ' + FolioSolicitud + ', Periodo: ' + Periodo + ', Ejercicio: ' + Ejercicio,
              color: 'warning',
              confirmText: 'Aceptar',
              showCancelButton: false, 
              callback: () => {}, 
          };
        } else{
          hasSolicitudCargoCancelado.value = false
        }

        // Guardar lista de movimientos
        movimientos.value = datos.map((m, index) => {
          const mesEncontrado = meses.find(x => x.value === m["Periodo Liq"]);
          
          return {
            num: m.Numero,
            cuenta: m.Cuenta,
            descripcion: m.Descripcion,
            referencia: m.Referencia,
            concepto: m.Concepto, // Es la descripcion en tabla Movimientos
            periodoLiq: mesEncontrado?.text || m["Periodo Liq"], // Usar la variable local mesEncontrado
            periodoLiqValue: mesEncontrado?.value || 0, 
            ejercicioLiq: m["Ejercicio Liq"],
            cargo: parseFloat(m.Cargo) || 0, 
            abono: parseFloat(m.Abono) || 0,
            liq: m.Liq,
            movimientoCajaCount: m.MovimientosCajaCount || 0,
            grupo: m.Grupo,
            idLiquidacion: m.IdLiquidacion,
            aLiquidar: m.ALiquidar,
            facturado: m.Facturado,
            esImpuesto: m.EsImpuesto,
            esSeguro: m.EsSeguro,
            esRenta: m.EsRenta,
            esAutomatico: m.EsAutomatico,
            idMovimiento: m.IdMovimiento,
          }
        })

        // console.log("Movimientos cargados:", movimientos.value)

        nuevoMovPoliza(1) // Limpiar campos de movimiento de póliza
      } else{
        movimientos.value = [] // Limpiar movimientos si no hay datos
        concepto.value = "" // Limpiar concepto si no hay datos
        ultimaModificacion.value = ""

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
      console.error("Error al consultar movimientos:", error)

      modalConfig.value = {
          visible: true, 
          title: 'Error Interno de la Aplicación',
          mensaje: 'Ocurrió un error al consultar los movimientos de la póliza.',
          color: 'error',
          confirmText: 'Aceptar',
          showCancelButton: false, 
          callback: () => {}, 
      };

    }
  }


  if(botonConsultar && isMovimientoEnEdicion.value){
    modalConfig.value = {
      visible: true, 
      title: 'Cambios sin guardar',
      mensaje: 'Si continúa, se perderán los cambios no guardados. ¿Desea continuar?',
      color: 'warning',
      confirmText: 'Aceptar',
      showCancelButton: true, 
      callback: callbackConsultarMovimientos, 
    };
    return;
  } else{
    await callbackConsultarMovimientos();
  }
}


const copiarPoliza = () => {
  if(!numeroPoliza.value){
    modalConfig.value = {
        visible: true, 
        title: 'Advertencia',
        mensaje: 'Debe seleccionar una póliza para copiar.',
        color: 'warning',
        confirmText: 'Aceptar',
        showCancelButton: false, 
        callback: () => {}, 
    };
    return;
  }

  // Validar que haya movimientos para copiar
  if (!movimientos.value || movimientos.value.length === 0) {
      modalConfig.value = {
          visible: true, 
          title: 'Advertencia',
          mensaje: 'No hay movimientos cargados para copiar.',
          color: 'warning',
          confirmText: 'Aceptar',
          showCancelButton: false, 
          callback: () => {}, 
      };
      return;
  }

  // Copiar y Transformar Movimientos
  const movimientosCopiados = movimientos.value.map(mov => {
      // Copia profunda del objeto movimiento
      const movCopia = { ...mov }; 
      
      // 🚨 CAMBIO CLAVE 1: Resetear identificadores únicos del movimiento
      movCopia.idMovimiento = null; // o undefined
      
      // También aseguramos que no quede marcado como relacionado a Caja/Liquidación
      movCopia.movimientoCajaCount = 0;
      movCopia.idLiquidacion = '00000000-0000-0000-0000-000000000000';
      movCopia.aLiquidar = 0;
      movCopia.facturado = 0;
      movCopia.liq = ''; 
      
      return movCopia;
  });

  // Resetear variables de Cabecera para Modo Creación
  idPoliza.value = null; // o undefined, según uses
  
  // Dejamos el concepto y los movimientos copiados tal cual
  movimientos.value = movimientosCopiados;


  isCopiaPoliza.value = true
  numeroPoliza.value = siguienteConsecutivo.value

  // Resetear flags de estado de la póliza copiada
  polizaBloqueada.value = false;
  isPolizaBloqueada.value = false;
  
  // Resetear flags de dependencia
  hasChequeLiquidacion.value = false;
  hasChequeLiquidacionCancelado.value = false;
  hasSolicitudCargo.value = false;
  hasSolicitudCargoCancelado.value = false;
  
  // Mostrar mensaje de éxito e iniciar la edición del nuevo registro
  temporalModalConfig.value = {
      visible: true, 
      title: 'Póliza Copiada',
      mensaje: 'La póliza y sus movimientos han sido copiados. Listo para guardar como nuevo registro.',
      color: 'success',
      timeout: 3000, 
  };
  
  // Limpiar el formulario de movimiento actual y preparar para un nuevo movimiento (opcional)
  nuevoMovPoliza(1);

}

// Guardar póliza
const guardarPoliza = async () => {
  try {

    const callbackCrearMovimientoCuadre = async () => {
      const diferencia = totales.value.Diferencia;

      if (diferencia !== 0) {
        const numerosExistentes = movimientos.value.map(mov => mov.num);
        const maxNum = numerosExistentes.length > 0 ? Math.max(...numerosExistentes) : 0;
        const nuevoNumConsecutivo = maxNum + 1;

        if(totales.TotalCargo < totales.TotalAbono){
          viewAbonoMovPoliza.value = formatNumber(Math.abs(diferencia));
        } else if(totales.TotalCargo > totales.TotalAbono){
          viewCargoMovPoliza.value = formatNumber(Math.abs(diferencia));
        }

          const nuevoMovimiento = {
              num: nuevoNumConsecutivo,
              cuenta: '999999999-999999999-999999999-999999999', 
              descripcion: 'CUENTA CUADRE',
              referencia: '',
              concepto: 'Ajuste por Cuadre',
              periodoLiq: "",
              periodoLiqValue: 0,
              ejercicioLiq: 0,
              cargo: diferencia > 0 ? 0 : Math.abs(diferencia),
              abono: diferencia > 0 ? diferencia : 0,
              liq: '',
              movimientoCajaCount: 0,
              grupo: 0,
              idLiquidacion: '00000000-0000-0000-0000-000000000000',
              aLiquidar: 0,
              facturado: 0,
              esImpuesto: 0,
              esSeguro: 0,
              esRenta: 0,
              esAutomatico: 0,
              idMovimiento: undefined,
          };

          // MODO NUEVO MOVIMIENTO
            movimientos.value.push(nuevoMovimiento);
            nuevoMovPoliza(1); 
      }
      

      // Cerrar el modal después de crear el movimiento
      modalConfig.value.visible = false;
      await guardarPoliza();
    
    };

    


    
    if (totales.value.Diferencia !== 0) {
      modalConfig.value = {
            visible: true, 
            title: 'Totales Descuadrados',
            mensaje: `La suma de los cargos no es igual a la suma de los abonos. ¿Desea crear el movimiento para guardar la póliza?`,
            color: 'error',
            confirmText: 'Sí, crear movimiento',
            cancelText: 'Cancelar',
            showCancelButton: true,
            callback: callbackCrearMovimientoCuadre, // Asignar el callback
        };
      return;
    }

    if(periodo.value === null || periodo.value === '' || periodo.value < 1 || periodo.value > 12){
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'El campo *Periodo* es obligatorio.',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

    if(yearContable.value === null || yearContable.value === '' || isNaN(parseInt(yearContable.value)) || yearContable.value < 1900){
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'El campo *Año Contable* es obligatorio y debe ser un año válido.',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

    if(tipoPoliza.value === null || tipoPoliza.value === '' || tipoPoliza.value < 1 || tipoPoliza.value > 3){
        
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'El campo *Tipo de Póliza* es obligatorio.',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

    if(numeroPoliza.value === null || numeroPoliza.value === '' || isNaN(parseInt(numeroPoliza.value)) || numeroPoliza.value < 1){
        
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'El campo *Número de Póliza* es obligatorio y debe ser un número válido.',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

    if(numeroPoliza.value > siguienteConsecutivo.value){
      // console.log("Numero de poliza: ", numeroPoliza.value)
      // con\sole.log("Siguiente consecutivo: ", siguienteConsecutivo.value)
      
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'El número de póliza no puede ser mayor al siguiente consecutivo (' + siguienteConsecutivo.value + ').',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

    if (concepto.value.trim() === '') {
        
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'El campo *Concepto* es obligatorio.',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

    if (movimientos.value.length === 0) {
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'No se puede guardar una póliza sin movimientos.',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

  } catch (error) {
    console.error("Error al guardar póliza:", error)
  }
  


  // Guardar la póliza después de pasar todas las validaciones
  try {
      const isUpdating = parseInt(numeroPoliza.value) < parseInt(siguienteConsecutivo.value);
      const userRole = getUserRole();
      const idUsuario = user.value?.id

      if(!idUsuario){
        modalConfig.value = {
            visible: true, 
            title: 'Error de Autenticación',
            mensaje: 'No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.',  //ESTO SALE A VECES IMPORTANTE VERIFICAR
            color: 'error',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        
        return;
      }

      const payload = {
          mes: periodo.value,
          year: yearContable.value,
          tipo: tipoPoliza.value,
          numero: numeroPoliza.value,
          concepto: concepto.value,
          polizaBloqueada: polizaBloqueada.value,
          movimientos: movimientos.value, // Lista de objetos JSON en el cuerpo
          userRole: userRole,
          idUsuario: idUsuario,
          idPoliza: idPoliza.value,
      };

      let res;

      if (isUpdating) {
          // Enviar el payload en el cuerpo del PUT
          res = await api.put('/contabilidad/administrar-polizas/poliza/actualizar', payload);
          // console.log("Se quiere actualizar")
      } else {
          // Enviar el payload en el cuerpo del POST
          res = await api.post('/contabilidad/administrar-polizas/poliza/crear', payload);
      }

      const resultado = res.data

      if(resultado){
        if(resultado.color === 'success'){
            temporalModalConfig.value = {
                visible: true, 
                title: resultado.title,
                mensaje: resultado.mensaje,
                color: resultado.color,
                timeout: 3000, 
            };
          obtenerSiguienteConsecutivo(true);
          isMovimientoEnEdicion.value = false
          
          // Volver a cargar los movimientos para refrescar la vista
          movimientosConsultar(periodo.value, yearContable.value, tipoPoliza.value, numeroPoliza.value, false);
        } else{
          modalConfig.value = {
              visible: true, 
              title: resultado.title,
              mensaje: resultado.mensaje,
              color: resultado.color,
              confirmText: 'Aceptar',
              showCancelButton: false, 
              callback: () => {}, 
          };
        }
        
      } else {
        modalConfig.value = {
            visible: true, 
            title: 'Error Interno de la Aplicación',
            mensaje: 'No se recibió respuesta del servidor al guardar la póliza.',
            color: 'error',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
      }

  } catch (error) {
    console.error("Error al guardar póliza:", error)

      modalConfig.value = {
          visible: true, 
          title: 'Error Interno de la Aplicación',
          mensaje: 'Ocurrió un error al guardar la póliza.',
          color: 'error',
          confirmText: 'Aceptar',
          showCancelButton: false, 
          callback: () => {}, 
      };
  }
}

const borrarPoliza = async () => {
    if(periodo.value === null || periodo.value === '' || periodo.value < 1 || periodo.value > 12){
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'El campo *Periodo* es obligatorio.',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

    if(yearContable.value === null || yearContable.value === '' || isNaN(parseInt(yearContable.value)) || yearContable.value < 1900){
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'El campo *Año Contable* es obligatorio y debe ser un año válido.',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

    if(tipoPoliza.value === null || tipoPoliza.value === '' || tipoPoliza.value < 1 || tipoPoliza.value > 3){
        
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'El campo *Tipo de Póliza* es obligatorio.',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

    if(numeroPoliza.value === null || numeroPoliza.value === '' || isNaN(parseInt(numeroPoliza.value)) || numeroPoliza.value < 1){
        
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'El campo *Número de Póliza* es obligatorio y debe ser un número válido.',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

    // Confirmar eliminación
    const callbackBorrado = async () => {
      const userRole = getUserRole();
      const idUsuario = user.value?.id

      if(!idUsuario){
        modalConfig.value = {
            visible: true, 
            title: 'Error de Autenticación',
            mensaje: 'No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.',
            color: 'error',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        
        return;
      }

      try {
        const res = await api.delete('/contabilidad/administrar-polizas/poliza/borrar', {
          params: {
            mes: periodo.value,
            year: yearContable.value,
            tipo: tipoPoliza.value,
            numero: numeroPoliza.value,
            userRole: userRole,
          }
        });

        const resultado = res.data;

        if (resultado) {
          if(resultado.color === 'success'){
            temporalModalConfig.value = {
              visible: true, 
              title: resultado.title,
              mensaje: resultado.mensaje,
              color: resultado.color,
              timeout: 3000, 
            };

            // Limpiar campos después de borrar
            movimientos.value = [];
            concepto.value = '';
            obtenerSiguienteConsecutivo(false);

          } else{
            modalConfig.value = {
              visible: true, 
              title: resultado.title,
              mensaje: resultado.mensaje,
              color: resultado.color,
              confirmText: 'Aceptar',
              showCancelButton: false, 
              callback: () => {}, 
            };
          }

          

        } else {
          modalConfig.value = {
              visible: true, 
              title: 'Error Interno de la Aplicación',
              mensaje: 'No se recibió respuesta del servidor al borrar la póliza.',
              color: 'error',
              confirmText: 'Aceptar',
              showCancelButton: false, 
              callback: () => {}, 
          };
        }

      } catch (error) {
        console.error("Error al borrar póliza:", error);

        modalConfig.value = {
            visible: true, 
            title: 'Error Interno de la Aplicación',
            mensaje: 'Ocurrió un error al borrar la póliza.',
            color: 'error',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
      }
    };

    modalConfig.value = {
        visible: true, 
        title: 'Confirmar Eliminación',
        mensaje: `¿Está seguro de que desea eliminar la póliza número ${numeroPoliza.value}? Esta acción no se puede deshacer.`,
        color: 'warning',
        confirmText: 'Sí, eliminar',
        cancelText: 'Cancelar',
        showCancelButton: true,
        callback: callbackBorrado,
    };
}


// Guardar Movimiento de Póliza
const guardarMovPoliza = async () => {
    const errores = []; 

    const cuentaCompleta = `${cuenta1MovPoliza.value}-${cuenta2MovPoliza.value}-${cuenta3MovPoliza.value}-${cuenta4MovPoliza.value}`;
    const cuentaTieneValores = 
        cuenta1MovPoliza.value && 
        cuenta2MovPoliza.value && 
        cuenta3MovPoliza.value && 
        cuenta4MovPoliza.value;
        
    // Validar los campos de Cargo y Abono como números
    const cargo = cargoMovPoliza.value;
    const abono = abonoMovPoliza.value;

    // REGLAS

    if (!movimientoMovPoliza.value || isNaN(parseInt(movimientoMovPoliza.value)) || parseInt(movimientoMovPoliza.value) < 1) {
        errores.push("El campo *Movimiento* es obligatorio y debe ser un número válido.");
    }

    if (!cuentaTieneValores) {
        errores.push("El campo *Cuenta* se encuentra incompleto o vacío. Revise todos los 4 segmentos.");
    }

    if (cargo <= 0 && abono <= 0) {
        errores.push("El campo *Cargo* o *Abono* debe ser diferente de cero.");
    }
    
    if (cargo > 0 && abono > 0) {
        errores.push("No se puede ingresar un valor en *Cargo* y *Abono* al mismo tiempo.");
    }

    
    if (posicionMovPoliza.value === null || posicionMovPoliza.value === '' || isNaN(parseInt(posicionMovPoliza.value)) || parseInt(posicionMovPoliza.value) < 1 || posicionMovPoliza.value > movimientos.value.length + 1) {
        posicionMovPoliza.value = movimientos.value.length + 1;
    }

    // if(!periodoLiqMovPoliza.value && ejercicioLiqMovPoliza.value){
    //     errores.push("El campo *Periodo de Liquidación* es obligatorio si se especifica un *Ejercicio de Liquidación*.");
    // }

    // if(!ejercicioLiqMovPoliza.value && periodoLiqMovPoliza.value){
    //     errores.push("El campo *Ejercicio de Liquidación* es obligatorio si se especifica un *Periodo de Liquidación*.");
    // }

    
    if((cuenta1MovPoliza.value) === '105000000'){
        
        if (!periodoLiqMovPoliza.value || !ejercicioLiqMovPoliza.value){
            errores.push("Para la cuenta 105000000, los campos *Periodo de Liquidación* y *Ejercicio de Liquidación* son obligatorios.");
        } else {
            const periodoAbierto = await validarPeriodoAbierto();

            if (!periodoAbierto) {
                // Si el backend devuelve 404, no hay periodos abiertos para liquidación.
                errores.push("Actualmente no existe ningún período de liquidación abierto en el sistema.");
            } else {
                const userMes = parseInt(periodoLiqMovPoliza.value);
                const userMesTexto = mesesMovPoliza.find(x => x.value === userMes)?.text || userMes;
                const userAnio = parseInt(ejercicioLiqMovPoliza.value);

                const oldestMes = periodoAbierto.PeriodoMes;
                const oldestMesTexto = mesesMovPoliza.find(x => x.value === oldestMes)?.text || oldestMes;
                const oldestAnio = periodoAbierto.PeriodoAnio;
                
                if (userAnio !== oldestAnio || userMes !== oldestMes) {
                    errores.push(`El período de liquidación seleccionado (${userMesTexto}/${userAnio}) no es el período de liquidación activo más antiguo. El período requerido es ${oldestMesTexto} del ejercicio ${oldestAnio}.`);
                }
            }
        }
    }


    const cuentaContableError = await validarSeleccionCuentaContable(cuentaCompleta);

    if (cuentaContableError !== null) {
      errores.push(cuentaContableError);
    }



    // MOSTRAR ERRORES
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


    // VALIDACION DE MOVIMIENTO EXISTENTE
    try {
        const numActual = parseInt(movimientoMovPoliza.value);
        let idMovimientoActual = undefined;

        // Obtener el ID del movimiento si está en modo EDICIÓN
        const index = movimientos.value.findIndex(mov => mov.num === numActual);
        
        if (index !== -1) {
            // Estamos en modo edición de un movimiento existente en la lista.
            idMovimientoActual = movimientos.value[index].idMovimiento;
        }

        // Si el movimiento existe, es decir, tiene un IdMovimiento, validar en el backend
        if (idMovimientoActual) {
            const res = await api.get('/contabilidad/movimientos-poliza/validar-movimiento', {
                params: { idMovimiento: idMovimientoActual }
            });

            const resultado = res.data;

            if (resultado && resultado.modificable === false) {
                modalConfig.value = {
                    visible: true, 
                    title: resultado.title || 'Error de Modificación',
                    mensaje: resultado.mensaje || 'El movimiento no se puede modificar',
                    color: resultado.color || 'warning',
                    confirmText: 'Aceptar',
                    showCancelButton: false, 
                    callback: () => {}, 
                };
                return; 
            }
        }
    } catch (error) {
        console.error("Error al validar movimiento con backend:", error);
        modalConfig.value = {
            visible: true, 
            title: 'Error de Conexión',
            mensaje: 'Ocurrió un error al intentar validar el movimiento con el servidor.',
            color: 'error',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    }

    // GUARDAR
    try {
        const numActual = parseInt(movimientoMovPoliza.value);
        
        const idMovimientoOriginal = typeof idMovimientoActual !== 'undefined' ? idMovimientoActual : undefined;
    
        const datosFormulario = {
            num: numActual, 
            cuenta: cuentaCompleta,
            descripcion: descripcionMovPoliza.value, 
            referencia: referenciaMovPoliza.value || '',
            concepto: conceptoMovPoliza.value || '', 
            periodoLiq: meses.find(x => x.value === periodoLiqMovPoliza.value)?.text || periodoLiqMovPoliza.value, 
            periodoLiqValue: periodoLiqMovPoliza.value || 0,
            ejercicioLiq: ejercicioLiqMovPoliza.value,
            cargo: cargo, 
            abono: abono, 
            liq: '', 
            movimientoCajaCount: 0, 
            grupo: 0,     
            idLiquidacion: '00000000-0000-0000-0000-000000000000', 
            aLiquidar: aLiquidarMovPoliza.value ? 1 : 0,
            facturado: facturadoMovPoliza.value ? 1 : 0,
            esImpuesto: esImpuestoMovPoliza.value ? 1 : 0,
            esSeguro: esSeguroMovPoliza.value ? 1 : 0,
            esRenta: esRentaMovPoliza.value ? 1 : 0,
            esAutomatico: esAutomaticoMovPoliza.value ? 1 : 0,
            idMovimiento: idMovimientoOriginal, // Usar el ID original si existe
        };

        const indexEncontrado = movimientos.value.findIndex(mov => mov.num === numActual);
            
            if (indexEncontrado !== -1) {
            // MODO EDICIÓN
            movimientos.value[indexEncontrado] = { ...movimientos.value[indexEncontrado], ...datosFormulario };
            
        } else {
            // MODO NUEVO MOVIMIENTO

            const posicionDeseada = parseInt(posicionMovPoliza.value);
            let indiceDeInsercion = posicionDeseada - 1; 

            indiceDeInsercion = Math.min(Math.max(0, indiceDeInsercion), movimientos.value.length);
            
            const nuevoMovimiento = { 
                num: 0, 
                ...datosFormulario
            };

            movimientos.value.splice(indiceDeInsercion, 0, nuevoMovimiento);
        }

        movimientos.value.forEach((mov, i) => { mov.num = i + 1 });
        
        temporalModalConfig.value = {
            visible: true, 
            title: 'Movimiento Guardado',
            mensaje: 'El movimiento se ha guardado correctamente en la lista de la póliza.',
            color: 'success',
            timeout: 3000, 
        };

        // Limpiar campos para nuevo movimiento
        nuevoMovPoliza(0);

        isMovimientoEnEdicion.value = true;
            
    } catch (error) {
        
        modalConfig.value = {
            visible: true, 
            title: 'Error Interno de la Aplicación',
            mensaje: 'Ocurrió un error inesperado al procesar el movimiento.',
            color: 'error',
            confirmText: 'Aceptar',
            showCancelButton: false, 
            callback: () => {}, 
        };
    }
};

const borrarMovPoliza = async () =>{
    if (movimientos.value.length === 0 || !movimientoMovPoliza.value) {
      return
    }

    const numActual = parseInt(movimientoMovPoliza.value)
    if (isNaN(numActual)){
      return
    } 

    const index = movimientos.value.findIndex(mov => mov.num === numActual)
    
    if (index !== -1) {
        const movAborrar = movimientos.value[index];
        
        const periodoMov = movAborrar.periodoLiqValue; 
        const anioMov = movAborrar.ejercicioLiq; 
        
        
        if (movAborrar.idMovimiento && movAborrar.cuenta.startsWith('105000000')) { 
            
            const periodoAbierto = await validarPeriodoAbierto();

            if (!periodoAbierto) {
                modalConfig.value = {
                    visible: true, 
                    title: 'Borrado No Permitido',
                    mensaje: 'No se pudo determinar el período abierto. No se permite el borrado.',
                    color: 'error',
                    confirmText: 'Aceptar',
                    showCancelButton: false, 
                    callback: () => {}, 
                };
                return;
            }

            const mesAbierto = periodoAbierto.PeriodoMes;
            const anioAbierto = periodoAbierto.PeriodoAnio;

            // Comparar si el período del movimiento es anterior o igual al período abierto
            const esPeriodoCerrado = anioMov < anioAbierto || (anioMov === anioAbierto && periodoMov < mesAbierto);

            if (esPeriodoCerrado) {
              modalConfig.value = {
                visible: true, 
                title: 'Borrado No Permitido',
                mensaje: 'No se puede eliminar el movimiento porque el periodo de liquidación está cerrado.',
                color: 'error',
                confirmText: 'Aceptar',
                showCancelButton: false, 
                callback: () => {}, 
              };
            return;
            }
        }
        
        const callbackBorrado = () => {
            // Eliminar el movimiento directamente usando el index capturado
            movimientos.value.splice(index, 1); 
            
            // Recalcular los números y limpiar campos
            movimientos.value.forEach((mov, i) => { mov.num = i + 1 });
            nuevoMovPoliza(0);

            isMovimientoEnEdicion.value = true;

        };
        
        
        modalConfig.value = {
            visible: true, 
            title: 'Confirmar eliminación',
            mensaje: `¿Estás seguro que deseas eliminar el movimiento #${numActual} de la póliza?`,
            color: 'error',
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            showCancelButton: true,
            callback: callbackBorrado, // Asignar el callback
        };
    } else {
        console.warn("Movimiento no encontrado para borrar:", numActual);
    }
};


// Validar que el período de liquidación esté abierto
const validarPeriodoAbierto = async (periodo, ejercicio) => {
  try {
    const res = await api.get('/contabilidad/movimiento-poliza/validar-periodo-abierto')
    // console.log("Respuesta de periodo abierto:", res.data)
    return res.data
    
  } catch (error) {
    modalConfig.value = {
        visible: true, 
        title: 'Error Interno de la Aplicación',
        mensaje: 'Ocurrió un error al validar el período de liquidación abierto.',
        color: 'error',
        confirmText: 'Aceptar',
        showCancelButton: false, 
        callback: () => {}, 
    };
    
    return null
  }
}






// =================================================================
// 4. FUNCIONES AUXILIARES DE INTERFAZ
// =================================================================

// Llenar el array de años para movimientos de póliza al montar el componente
onMounted(() => {
  llenarYearMovPoliza();
});

// La función que se llama cuando se presiona el boton de confirmar en el modal
const ejecutarAccion = () => {
    modalConfig.value.callback();
};


const primeraAdminPoliza = async () => {
  const callbackConsultarMovimientos = () => {
    // Lógica para ir a la primera póliza
    if (!periodo.value || !yearContable.value || !tipoPoliza.value) return

    movimientosConsultar(periodo.value, yearContable.value, tipoPoliza.value, 1, false);
    numeroPoliza.value = 1

  }

  if(isMovimientoEnEdicion.value){
    modalConfig.value = {
      visible: true, 
      title: 'Cambios sin guardar',
      mensaje: 'Si continúa, se perderán los cambios no guardados. ¿Desea continuar?',
      color: 'warning',
      confirmText: 'Aceptar',
      showCancelButton: true, 
      callback: callbackConsultarMovimientos, 
    };
    return;
  } else{
    callbackConsultarMovimientos();
  }
  
}

const anteriorAdminPoliza = async () => {
  const callbackConsultarMovimientos = () => {
    // Lógica para ir a la póliza anterior
    if (!periodo.value || !yearContable.value || !tipoPoliza.value) return

    const numActual = parseInt(numeroPoliza.value)
    if (isNaN(numActual) || numActual <= 1) return

    const numAnterior = numActual - 1
    movimientosConsultar(periodo.value, yearContable.value, tipoPoliza.value, numAnterior, false, -1);
    numeroPoliza.value = numAnterior
  }

  if(isMovimientoEnEdicion.value){
    modalConfig.value = {
      visible: true, 
      title: 'Cambios sin guardar',
      mensaje: 'Si continúa, se perderán los cambios no guardados. ¿Desea continuar?',
      color: 'warning',
      confirmText: 'Aceptar',
      showCancelButton: true, 
      callback: callbackConsultarMovimientos, 
    };
    return;
  } else{
    callbackConsultarMovimientos();
  }

}

// Lógica para ir a la póliza siguiente
const siguienteAdminPoliza = async () => {
  const callbackConsultarMovimientos = () => {
    // Lógica para ir a la póliza siguiente
    if (!periodo.value || !yearContable.value || !tipoPoliza.value) return;

    const numActual = parseInt(numeroPoliza.value);

    if (isNaN(numActual) || numActual >= siguienteConsecutivo.value - 1) return;

    const numSiguiente = numActual + 1;
    movimientosConsultar(periodo.value, yearContable.value, tipoPoliza.value, numSiguiente, false, 1);
    numeroPoliza.value = numSiguiente;
  }

  if(isMovimientoEnEdicion.value){
    modalConfig.value = {
      visible: true, 
      title: 'Cambios sin guardar',
      mensaje: 'Si continúa, se perderán los cambios no guardados. ¿Desea continuar?',
      color: 'warning',
      confirmText: 'Aceptar',
      showCancelButton: true, 
      callback: callbackConsultarMovimientos, 
    };
    return;
  } else{
    callbackConsultarMovimientos();
  }
};

// Lógica para ir a la última póliza
const ultimaAdminPoliza = async () => {
  const callbackConsultarMovimientos = () => {
    if (!periodo.value || !yearContable.value || !tipoPoliza.value) return;

    movimientosConsultar(periodo.value, yearContable.value, tipoPoliza.value, siguienteConsecutivo.value - 1, false);
    numeroPoliza.value = siguienteConsecutivo.value - 1;
  }

  if(isMovimientoEnEdicion.value){
    modalConfig.value = {
      visible: true, 
      title: 'Cambios sin guardar',
      mensaje: 'Si continúa, se perderán los cambios no guardados. ¿Desea continuar?',
      color: 'warning',
      confirmText: 'Aceptar',
      showCancelButton: true, 
      callback: callbackConsultarMovimientos, 
    };
    return;
  } else{
    callbackConsultarMovimientos();
  }
};


// Formatear el número de cuenta con ceros a la izquierda hasta 9 dígitos
const padZerosRightRef = (fieldRef) => {
  if (!fieldRef.value) {
    fieldRef.value = ""
    return
  }
  fieldRef.value = String(fieldRef.value ?? '').padEnd(9, '0')

  // recortar si es mayor a 9:
  fieldRef.value = fieldRef.value.slice(0, 9)
}

const onBlurCuenta1 = () => {
  cuenta1MovPoliza.value = cuenta1MovPoliza.value.replace(/[^0-9]/g, '')
  padZerosRightRef(cuenta1MovPoliza)
}

const onBlurCuenta2 = () => {
  cuenta2MovPoliza.value = cuenta2MovPoliza.value.replace(/[^0-9]/g, '')
  padZerosRightRef(cuenta2MovPoliza)
}

const onBlurCuenta3 = () => {
  cuenta3MovPoliza.value = cuenta3MovPoliza.value.replace(/[^0-9]/g, '')
  padZerosRightRef(cuenta3MovPoliza)
}

const onBlurCuenta4 = () => {
  cuenta4MovPoliza.value = cuenta4MovPoliza.value.replace(/[^0-9]/g, '')
  padZerosRightRef(cuenta4MovPoliza)
  buscarCuentaContable()
}

/**
 * Realiza la llamada a la API para buscar la cuenta contable.
 */
const buscarCuentaContable = async () => {
    if (!cuenta1MovPoliza.value || !cuenta2MovPoliza.value || !cuenta3MovPoliza.value || !cuenta4MovPoliza.value) {
      return;
    }
    
    try {
      const res = await api.get('/contabilidad/get-cuenta-contable', {
        params: {
          cuenta1: cuenta1MovPoliza.value,
          cuenta2: cuenta2MovPoliza.value,
          cuenta3: cuenta3MovPoliza.value,
          cuenta4: cuenta4MovPoliza.value,
        }
      });

      const data = res.data;
      descripcionMovPoliza.value = data.descripcion || '';

    } catch (error) {
        const status = error.response ? error.response.status : null;
        descripcionMovPoliza.value = '';
        if (status === 404) {
          modalConfig.value = {
              visible: true, 
              title: 'Advertencia',
              mensaje: 'La cuenta contable no fue encontrada.',
              color: 'warning',
              confirmText: 'Aceptar',
              showCancelButton: false, 
              callback: () => {}, 
          };
        } else {
          modalConfig.value = {
              visible: true, 
              title: 'Error Interno de la Aplicación',
              mensaje: 'Ocurrió un error al buscar la cuenta contable.',
              color: 'error',
              confirmText: 'Aceptar',
              showCancelButton: false, 
              callback: () => {}, 
          };
        }
    }
}


const validarSeleccionCuentaContable = async (numeroCuentaContable) => {
  let mensajeError = null; 
  
  try {
    const res = await api.get('/contabilidad/verificar-cuenta-contable', {
      params: { numeroCuenta: numeroCuentaContable }
    });
    
    const data = res.data;

    if (data.esValida === false) {
      mensajeError = data.mensajeError || "La cuenta contable seleccionada no es válida.";
      
    } 
    
  } catch (error) {
    mensajeError = "Ocurrió un error de conexión. Intente de nuevo.";
  } 
  return mensajeError;
}


// Filtrar la entrada para que solo acepte números
const filtrarNumericos = (event) => {
  event.target.value = event.target.value.replace(/[^0-9]/g, '');
};


// Traer los datos del modal y llenar los campos de cuenta y descripción
const seleccionarCuentaContableSwal = (data) => {
  if (data) {
    const numeroCuentaCompleto = data.numTabla;
    const partes = numeroCuentaCompleto.split('-');
    
    cuenta1MovPoliza.value = partes[0] || '';
    cuenta2MovPoliza.value = partes[1] || '';
    cuenta3MovPoliza.value = partes[2] || '';
    cuenta4MovPoliza.value = partes[3] || '';
    
    descripcionMovPoliza.value = data.nombreTabla;

    liqSeleccionado.value = ''
  }
};

// Traer los datos del modal de seleccionar póliza y llenar los campos
const seleccionarPolizaSwal = (data) => {
  const callbackConsultarMovimientos = () => {
    if (data) {
      const mes = data.periodoMes;
      const year = data.periodoAnio;
      const tipo = data.tipo;
      const numero = data.consecutivo;

      fecha.value = `01/${mes}/${year}`; 
      tipoPoliza.value = String(tipo);
      numeroPoliza.value = numero;
      // periodo.value = mes;
      // yearContable.value = year;

      movimientosConsultar(mes, year, tipo, numero, false);
    }
  }
  
  if(isMovimientoEnEdicion.value){
    modalConfig.value = {
      visible: true, 
      title: 'Cambios sin guardar',
      mensaje: 'Si continúa, se perderán los cambios no guardados. ¿Desea continuar?',
      color: 'warning',
      confirmText: 'Aceptar',
      showCancelButton: true, 
      callback: callbackConsultarMovimientos, 
    };
    return;
  } else{
    callbackConsultarMovimientos();
  }
};

const abrirModal = () => {
  cuentasParaModal.value.grupoUnoDe = cuenta1MovPoliza.value
  cuentasParaModal.value.grupoDosDe = cuenta2MovPoliza.value
  cuentasParaModal.value.grupoTresDe = cuenta3MovPoliza.value
  cuentasParaModal.value.grupoCuatroDe = cuenta4MovPoliza.value
  
  modalVisible.value = true 
}

const abrirModalSeleccionarPoliza = () => {
  modalSeleccionarPolizaVisible.value = true 
}



const nuevaPoliza = () => {
  const callbackConsultarMovimientos = () => {
    // obtenerSiguienteConsecutivo(false)
    const today = new Date();
    
    const dia = String(today.getDate()).padStart(2, '0');
    const mes = String(today.getMonth() + 1).padStart(2, '0'); // +1 porque es 0-indexado
    const anio = today.getFullYear();
    
    fecha.value = `${dia}/${mes}/${anio}`;
    tipoPoliza.value = null
    numeroPoliza.value = null
    concepto.value = ''
    movimientos.value = []
    ultimaModificacion.value = ''
    isPolizaBloqueada.value = false
    polizaBloqueada.value = false

    hasChequeLiquidacion.value = false
    hasChequeLiquidacionCancelado.value = false
    hasSolicitudCargo.value = false
    hasSolicitudCargoCancelado.value = false
    isMovimientoEnEdicion.value = false
    idPoliza.value = null
    nuevoMovPoliza(1)
}

    if(isMovimientoEnEdicion.value){
    modalConfig.value = {
      visible: true, 
      title: 'Cambios sin guardar',
      mensaje: 'Si continúa, se perderán los cambios no guardados. ¿Desea continuar?',
      color: 'warning',
      confirmText: 'Aceptar',
      showCancelButton: true, 
      callback: callbackConsultarMovimientos, 
    };
    return;
  } else{
    callbackConsultarMovimientos();
  }
}

const nuevoMovPoliza = (forzarBorrarTodo) => {
  if (forzarBorrarTodo) {
    cuenta1MovPoliza.value = ''
    cuenta2MovPoliza.value = ''
    cuenta3MovPoliza.value = ''
    cuenta4MovPoliza.value = ''
    descripcionMovPoliza.value = ''

    referenciaMovPoliza.value = ''
    conceptoMovPoliza.value = ''
  } else {
    if (!fijarCuentaMovPoliza.value) {
      cuenta1MovPoliza.value = ''
      cuenta2MovPoliza.value = ''
      cuenta3MovPoliza.value = ''
      cuenta4MovPoliza.value = ''
      descripcionMovPoliza.value = ''
    }

    if (!fijarReferenciaConceptoMovPoliza.value) {
      referenciaMovPoliza.value = ''
      conceptoMovPoliza.value = ''
    }
  }
  movimientoMovPoliza.value = obtenerCantidadMovimientos()
  posicionMovPoliza.value = movimientoMovPoliza.value
  isNuevoMovimiento.value = true

  cargoMovPoliza.value = 0
  abonoMovPoliza.value = 0
  viewCargoMovPoliza.value = '0.00'
  viewAbonoMovPoliza.value = '0.00'
  periodoLiqMovPoliza.value = null
  ejercicioLiqMovPoliza.value = yearContable.value || null
  aLiquidarMovPoliza.value = false
  facturadoMovPoliza.value = false
  esImpuestoMovPoliza.value = false
  esSeguroMovPoliza.value = false
  esRentaMovPoliza.value = false
  esAutomaticoMovPoliza.value = false

  isMovimientoEnCaja.value = false
  isPolizaBloqueada.value = false
  validacionMovimientoEsModificable.value = true


}

// Obtener la cantidad de movimientos para asignar el siguiente número
function obtenerCantidadMovimientos() {
  const maxNum = movimientos.value.reduce((max, mov) => Math.max(max, mov.num), 0)
  return maxNum + 1
}


const validacionesOnClickMovimiento = async (idMovimiento) => {
  validacionMovimientoEsModificable.value = true
  
  const res = await api.get('/contabilidad/movimientos-poliza/validar-movimiento', {
    params: { idMovimiento: idMovimiento }
  });

  const resultado = res.data;

  if(resultado){
    if(resultado.modificable === false){
      modalConfig.value = {
          visible: true, 
          title: resultado.title || 'Advertencia',
          mensaje: resultado.mensaje || 'El Movimiento no se puede modificar.',
          color: resultado.color || 'warning',
          confirmText: 'Aceptar',
          showCancelButton: false, 
          callback: () => {}, 
      };
      validacionMovimientoEsModificable.value = false
      return false

    } else{
      validacionMovimientoEsModificable.value = true
      return true
    }

  } else{
    validacionMovimientoEsModificable.value = false
    modalConfig.value = {
        visible: true, 
        title: 'Error Interno de la Aplicación',
        mensaje: 'No se recibió respuesta del servidor al validar el movimiento de póliza.',
        color: 'error',
        confirmText: 'Aceptar',
        showCancelButton: false, 
        callback: () => {}, 
    };
    return false
  }
}


// Seleccionar fila de la tabla de movimientos y llenar los campos del movimiento de póliza
const onRowClick = (event, { item }) => {
  const row = item.raw ?? item

  const resultadoValidaciones = validacionesOnClickMovimiento(row.idMovimiento)
  if(!resultadoValidaciones){
    return
  }

  // console.log("Movimiento seleccionado:", row)

  if(row.movimientoCajaCount > 0){
    isMovimientoEnCaja.value = true
    modalConfig.value = {
        visible: true, 
        title: 'Advertencia',
        mensaje: 'El Movimiento no se puede modificar porque se encuentra relacionado en Caja.',
        color: 'warning',
        confirmText: 'Aceptar',
        showCancelButton: false, 
        callback: () => {}, 
    };
  } else{
    isMovimientoEnCaja.value = false
  }

  movimientoMovPoliza.value = row.num
  posicionMovPoliza.value = null
  isNuevoMovimiento.value = false
  
  const partes = row.cuenta?.split('-') ?? []
  cuenta1MovPoliza.value = partes[0] || ''
  cuenta2MovPoliza.value = partes[1] || ''
  cuenta3MovPoliza.value = partes[2] || ''
  cuenta4MovPoliza.value = partes[3] || ''

  descripcionMovPoliza.value = row.descripcion
  cargoMovPoliza.value = row.cargo
  abonoMovPoliza.value = row.abono
  viewCargoMovPoliza.value = formatAsCurrency(row.cargo);
  viewAbonoMovPoliza.value = formatAsCurrency(row.abono);
  periodoLiqMovPoliza.value = row.periodoLiqValue
  ejercicioLiqMovPoliza.value = row.ejercicioLiq


  referenciaMovPoliza.value = row.referencia
  conceptoMovPoliza.value = row.concepto

  liqSeleccionado.value = row.liq
  if(!liqSeleccionado.value){
    liqSeleccionado.value = 'Id. Liquidación'
    existeIdLiquidacion.value = false
  } else{
    existeIdLiquidacion.value = true
  }

  aLiquidarMovPoliza.value = row.aLiquidar === 1 || row.aLiquidar === true
  facturadoMovPoliza.value = row.facturado === 1 || row.facturado === true
  esImpuestoMovPoliza.value = row.esImpuesto === 1 || row.esImpuesto === true
  esSeguroMovPoliza.value = row.esSeguro === 1 || row.esSeguro === true
  esRentaMovPoliza.value = row.esRenta === 1 || row.esRenta === true
  esAutomaticoMovPoliza.value = row.esAutomatico === 1 || row.esAutomatico === true

}

// Llenar el array de años para movimientos de póliza desde la API
const llenarYearMovPoliza = async () => {
  try {
    const res = await api.get("/contabilidad/movimiento-poliza/get-years");
    const years = res.data.lista_years || [];

    const yearsMapeados = years.map(year => ({
      text: year.toString(),
      value: year
    }));

    yearMovPoliza.value = yearsMapeados;

    const yearActual = new Date().getFullYear();
    const yearActualItem = yearsMapeados.find(item => item.value === yearActual);

    if (yearActualItem) {
      ejercicioLiqMovPoliza.value = yearActualItem.value;
    } else if (yearsMapeados.length > 0) {
      ejercicioLiqMovPoliza.value = yearsMapeados[0].value;
    }

  } catch (error) {
    
    modalConfig.value = {
        visible: true, 
        title: 'Error Interno de la Aplicación',
        mensaje: 'Ocurrió un error al obtener los años para movimientos de póliza.',
        color: 'error',
        confirmText: 'Aceptar',
        showCancelButton: false, 
        callback: () => {}, 
    };
  }
};

// Navegar al movimiento de póliza anterior
const anteriorMovPoliza = () => {
  const numActual = parseInt(movimientoMovPoliza.value)
  if (isNaN(numActual) || numActual <= 1) return

  const numAnterior = numActual - 1
  const filaAnterior = movimientos.value.find(mov => mov.num === numAnterior)
  if (filaAnterior) {
    onRowClick(null, { item: filaAnterior })
  }
}

// Navegar al siguiente movimiento de póliza
const siguienteMovPoliza = () => {
  const numActual = parseInt(movimientoMovPoliza.value)
  if (isNaN(numActual)) return

  const numSiguiente = numActual + 1
  const filaSiguiente = movimientos.value.find(mov => mov.num === numSiguiente)
  if (filaSiguiente) {
    onRowClick(null, { item: filaSiguiente })
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



// Convierte una cadena de texto (incluso formateada con comas) a un número flotante limpio.
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


const onBlurCargoMovPoliza = () => {
    const numericalValue = getNumericalValue(viewCargoMovPoliza); 
    cargoMovPoliza.value = numericalValue;
    
    viewCargoMovPoliza.value = formatAsCurrency(numericalValue);
};

const onBlurAbonoMovPoliza = () => {
    const numericalValue = getNumericalValue(viewAbonoMovPoliza); 
    abonoMovPoliza.value = numericalValue;
    
    viewAbonoMovPoliza.value = formatAsCurrency(numericalValue);
};


// Asegurarse que solo uno de los campos Cargo o Abono tenga valor
const onCargoInput = () => {
    viewCargoMovPoliza.value = cleanInput(viewCargoMovPoliza.value);

    if (viewCargoMovPoliza.value) { 
        viewAbonoMovPoliza.value = '0.00';
        abonoMovPoliza.value = 0;
    }
};

const onAbonoInput = () => {
    viewAbonoMovPoliza.value = cleanInput(viewAbonoMovPoliza.value);

    if (viewAbonoMovPoliza.value) {
        viewCargoMovPoliza.value = '0.00';
        cargoMovPoliza.value = 0; 
    }
};

// Función para limpiar la entrada y permitir solo números y puntos.
const cleanInput = (value) => {
    return String(value).replace(/[^\d.]/g, ''); 
};




// Exportar póliza a PDF
const exportarPDFHandler = async () => {
    const callbackGenerarPDF = async () => {
        try {
            // 1. Preparar datos
            const movimientosPDF = movimientos.value.map(mov => ({
                num: mov.num,
                cuenta: mov.cuenta,
                referencia: mov.referencia,
                concepto: mov.concepto,
                cargo: mov.cargo,
                abono: mov.abono,
                periodoLiq: mov.periodoLiq,
                ejercicioLiq: mov.ejercicioLiq
            }));

            const datosPoliza = {
                fecha: fecha.value,
                periodo: periodo.value,
                ejercicio: yearContable.value,
                tipo: tipoPoliza.value,
                numero: numeroPoliza.value,
                concepto: concepto.value,
                movimientos: movimientosPDF,
                totalCargo: totales.value.TotalCargo,
                totalAbono: totales.value.TotalAbono,
            };

            // 2. Generar el PDF
            const exito = await generarPDFPoliza(datosPoliza);

            if (exito) {
                temporalModalConfig.value = {
                    visible: true,
                    title: 'PDF Generado',
                    mensaje: 'El PDF de la póliza se ha generado correctamente.',
                    color: 'success',
                    timeout: 3000,
                };
            } else {
                modalConfig.value = {
                    visible: true,
                    title: 'Error',
                    mensaje: 'No se pudo generar el PDF.',
                    color: 'error',
                    confirmText: 'Aceptar',
                    showCancelButton: false,
                    callback: () => {},
                };
            }
        } catch (error) {
            console.error("Error en proceso de impresión:", error);
            modalConfig.value = {
                visible: true,
                title: 'Error',
                mensaje: 'Ocurrió un error al generar el documento.',
                color: 'error',
                confirmText: 'Aceptar',
                showCancelButton: false,
                callback: () => {},
            };
        }
    };

    if (isMovimientoEnEdicion.value) {
        modalConfig.value = {
            visible: true, 
            title: 'Advertencia',
            mensaje: 'Tiene cambios sin guardar. Por favor, guarde la póliza antes de generar el documento.',
            color: 'warning',
            confirmText: 'Aceptar', 
            showCancelButton: false, 
            callback: () => {}, 
        };
        return;
    } else {
        await callbackGenerarPDF();
    }
    
};


// Exportar póliza a Excel
const exportarExcelHandler = async () => {

  const callbackGenerarExcel = async () => {

    try {
      // 1. Preparar datos
      const movimientosPDF = movimientos.value.map(mov => ({
            num: mov.num,
            cuenta: mov.cuenta,
            descripcion: mov.descripcion,
            referencia: mov.referencia,
            concepto: mov.concepto,
            periodoLiq: mov.periodoLiq,
            ejercicioLiq: mov.ejercicioLiq,
            cargo: mov.cargo,
            abono: mov.abono,
            liq: mov.liq
        }));

        const totalCargo = totales.value.TotalCargo; 
        const totalAbono = totales.value.TotalAbono; 

        const datosPoliza = {
            fecha: fecha.value, 
            periodo: periodo.value,
            ejercicio: yearContable.value,
            tipo: tipoPoliza.value,
            numero: numeroPoliza.value,
            concepto: concepto.value,
            movimientos: movimientosPDF,
            totalCargo: totalCargo,
            totalAbono: totalAbono,
        };

        const exito = await generarExcelPoliza(datosPoliza);

        if (exito) {
            temporalModalConfig.value = {
                visible: true, 
                title: 'Excel Generado',
                mensaje: 'El archivo Excel de la póliza se ha generado correctamente.',
                color: 'success',
                timeout: 3000, 
            };
        } else {
            modalConfig.value = {
                visible: true, 
                title: 'Error al Generar Excel',
                mensaje: 'Ocurrió un error al generar el archivo Excel de la póliza.',
                color: 'error',
                confirmText: 'Aceptar',
                showCancelButton: false, 
                callback: () => {}, 
            };
        }
    } catch (error) {
        modalConfig.value = {
            visible: true,
            title: 'Error',
            mensaje: 'Ocurrió un error al generar el documento.',
            color: 'error',
            confirmText: 'Aceptar',
            showCancelButton: false,
            callback: () => {},
        };
    }
  };



    
  if (isMovimientoEnEdicion.value) {
      modalConfig.value = {
          visible: true, 
          title: 'Advertencia',
          mensaje: 'Tiene cambios sin guardar. Por favor, guarde la póliza antes de generar el documento.',
          color: 'warning',
          confirmText: 'Aceptar', 
          showCancelButton: false, 
          callback: () => {}, 
      };
      return;
  } else {
      await callbackGenerarExcel();
  }
    
};



// Navegar a Inicio
const irAInicio = () => {
    
    const callbackIrAInicio = async () => { 
        try {
          router.push({ name: 'inicio' });
        } catch (error) {
            console.error("Error al navegar:", error);
            modalConfig.value = {
                visible: true, 
                title: 'Error de Navegación',
                mensaje: 'Ocurrió un error al intentar navegar a la página de inicio.',
                color: 'error',
                confirmText: 'Aceptar',
                showCancelButton: false, 
                callback: () => {}, 
            };
        }
    };

    if (isMovimientoEnEdicion.value) {
        modalConfig.value = {
            visible: true, 
            title: 'Cambios sin guardar',
            mensaje: 'Si continúa, se perderán los cambios no guardados. ¿Desea continuar?',
            color: 'warning',
            confirmText: 'Aceptar',
            showCancelButton: true, 
            callback: callbackIrAInicio, 
        };
        return;
    } else {
      callbackIrAInicio();
    }
}




// =================================================================
// 5. WATCHERS
// =================================================================

// Obtener el periodo y año contable
watch(fecha, newVal => {
  if (newVal) {
    // newVal viene como "DD/MM/YYYY"
    const [dia, mesStr, yearStr] = newVal.split('/')
    const mes = parseInt(mesStr)
    const year = parseInt(yearStr)

    periodo.value = meses.find(m => m.value === mes).value
    yearContable.value = year
  }
})

// Estar atentos a los cambios en periodo, yearContable y tipoPoliza
watch([periodo, yearContable, tipoPoliza], () => {
  const callbackConsultarMovimientos = () => {
    obtenerSiguienteConsecutivo(false); 
    if(!isCopiaPoliza.value){
      movimientos.value = []; 
      concepto.value = ""
    } 
  }

  if(isMovimientoEnEdicion.value){
    modalConfig.value = {
      visible: true, 
      title: 'Cambios sin guardar',
      mensaje: 'Si continúa, se perderán los cambios no guardados. ¿Desea continuar?',
      color: 'warning',
      confirmText: 'Aceptar',
      showCancelButton: true, 
      callback: callbackConsultarMovimientos, 
    };
    return;
  } else{
      callbackConsultarMovimientos();
  }

});

// Limpiar el número de póliza si se cambia el tipo de póliza
watch(tipoPoliza, (nuevoValor) => {
  if (nuevoValor === null) {
    numeroPoliza.value = ''
  }
})

</script>


<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard title="Administrar Pólizas">
          <VCardText>
            <!-- A partir de aqui es el formulario -->
            <VForm @submit.prevent="() => {}">
            
              <VRow>
                <VCol cols="12" class="d-flex flex-wrap gap-4">
                  <VBtn color="primary" @click="guardarPoliza" :disabled="hasChequeLiquidacion || hasChequeLiquidacionCancelado || hasSolicitudCargo || hasSolicitudCargoCancelado || (!hasPermission('9FD6E670-6AD6-4166-8BBC-6F0C73B151A8') && isPolizaBloqueada)">
                    <VIcon class="me-2" icon="tabler-device-floppy" />
                    Guardar
                  </VBtn>

                  <VBtn color="primary" @click="nuevaPoliza">
                    <VIcon class="me-2" icon="tabler-file-plus" />
                    Nuevo
                  </VBtn>

                  <VBtn color="primary" @click="movimientosConsultar(periodo, yearContable, tipoPoliza, numeroPoliza, true)">
                    <VIcon class="me-2" icon="tabler-search" />
                    Consultar
                  </VBtn>

                  <VBtn color="primary" @click="abrirModalSeleccionarPoliza">
                    <VIcon class="me-2" icon="tabler-pointer" />
                    Seleccionar
                  </VBtn>

                  <VBtn color="primary" @click="borrarPoliza" :disabled="hasChequeLiquidacion || hasChequeLiquidacionCancelado || hasSolicitudCargo || hasSolicitudCargoCancelado || (!hasPermission('9FD6E670-6AD6-4166-8BBC-6F0C73B151A8') && isPolizaBloqueada)">
                    <VIcon class="me-2" icon="tabler-trash" />
                    Eliminar
                  </VBtn>

                  <VBtn color="primary" @click="copiarPoliza" :disabled="!movimientos || movimientos.length === 0 || !numeroPoliza">
                    <VIcon class="me-2" icon="tabler-copy" />
                    Copiar
                  </VBtn>

                  <VBtn color="primary" @click="exportarPDFHandler" :disabled="!movimientos || movimientos.length === 0 || !numeroPoliza">
                    <VIcon class="me-2" icon="tabler-printer" />
                    Imprimir
                  </VBtn>

                  <VBtn color="primary" @click="exportarExcelHandler" :disabled="!movimientos || movimientos.length === 0 || !numeroPoliza">
                    <VIcon class="me-2" icon="tabler-file-spreadsheet" />
                    Excel
                  </VBtn>

                  <VBtn color="primary" @click="irAInicio">
                    <VIcon class="me-2" icon="tabler-home" />
                    Inicio
                  </VBtn>

                </VCol>
              </VRow>

              <VRow>
                
                <VCol cols="12" class="d-flex flex-wrap gap-4 justify-end">

                  <VBtn color="secondary" @click="primeraAdminPoliza" :disabled="numeroPoliza <= 1 || !numeroPoliza">
                    <VIcon class="me-2" icon="tabler-chevrons-left" />
                    Primera
                  </VBtn>

                  <VBtn color="secondary" @click="anteriorAdminPoliza" :disabled="numeroPoliza <= 1 || !numeroPoliza">
                    <VIcon class="me-2" icon="tabler-chevron-left" />
                    Anterior
                  </VBtn>

                  <VBtn color="secondary" @click="siguienteAdminPoliza" :disabled="numeroPoliza >= siguienteConsecutivo-1 || !numeroPoliza">
                    <VIcon class="me-2" icon="tabler-chevron-right" />
                    Siguiente
                  </VBtn>

                  <VBtn color="secondary" @click="ultimaAdminPoliza" :disabled="numeroPoliza >= siguienteConsecutivo-1 || !numeroPoliza">
                    <VIcon class="me-2" icon="tabler-chevrons-right" />
                    Último
                  </VBtn>

                </VCol>
              </VRow>
              <VRow>
                <VCol cols="12" v-if="isCopiaPoliza">
                  <VIcon class="me-2" icon="tabler-alert-circle" />
                  <strong>Ésta es una póliza copiada, favor de modificarla antes de guardarla.</strong>
                </VCol>
              </VRow>

              <VDivider class="mt-5 mb-5"/>

              <VRow>
                <!-- Fecha -->
                <VCol cols="12" md="4" class="comprimir-col">
                  <AppDateTimePicker
                    v-model="fecha"
                    label="* Fecha"
                    placeholder="Selecciona la fecha"
                  />
                </VCol>

                 <!-- Periodo -->
                <VCol cols="12" md="4" class="comprimir-col">
                  <AppSelect
                    v-model="periodo"
                    label="Periodo"
                    placeholder="Mes"
                    :items="meses"
                    item-title="text"
                    item-value="value"
                    variant="filled"
                    readonly
                    tabindex="-1"
                  />
                </VCol>

                <!-- Año contable -->
                <VCol cols="12" md="4" class="comprimir-col">
                  <AppSelect
                    v-model="yearContable"
                    label="Año contable"
                    placeholder="Año"
                    :items="[yearContable]"
                    readonly
                    tabindex="-1"
                  />
                </VCol>
              </VRow> 

              <VRow>
                <!-- Tipo de Póliza -->
                <VCol cols="12" md="6" class="comprimir-col">
                  <AppSelect
                    v-model="tipoPoliza"
                    label="* Tipo de Póliza"
                    :items="itemsTipoPoliza"
                    item-title="text"
                    item-value="value"
                    :rules="[v => v !== null || 'Debes seleccionar un tipo de póliza']"
                  />
                </VCol>
                <!-- :rules="[v => v !== null || 'Debes seleccionar un tipo de póliza']" --> 

                <!-- Numero de poliza-->
                <VCol cols="12" md="6"  class="comprimir-col">
                  <AppTextField
                    v-model="numeroPoliza"
                    label="* Número de Póliza"
                    placeholder="Ingrese el número de póliza"
                    @input="filtrarNumericos"
                    @focus="seleccionarTodo"
                  />
                </VCol>
              </VRow>

              <VRow>
                <!-- Concepto -->
                <VCol cols="12" md="12" class="comprimir-col">
                  <AppTextarea
                    v-model="concepto"
                    label="* Concepto"
                    rows="2"
                    no-resize
                  />
                </VCol>
              </VRow>

              <VRow>
                <!-- <VCol cols="12" v-if="hasPermission('9FD6E670-6AD6-4166-8BBC-6F0C73B151A8')">
                  <VCheckbox
                    v-model="polizaBloqueada"
                    label="Póliza Bloqueada"
                  />
                </VCol> -->



                <VCol cols="6" md="3" class="comprimir-col">
                  <VCheckbox
                    v-model="polizaBloqueada"
                    label="Póliza Bloqueada"
                    :disabled="!hasPermission('9FD6E670-6AD6-4166-8BBC-6F0C73B151A8')"
                  />
                </VCol>

                <VCol cols="6" md="9">
                    <div class="">{{ ultimaModificacion }}</div>
                </VCol>

               
              </VRow>
              
            </VForm>
            <!-- Aqui termina el formulario -->
            </VCardText>
        </VCard>
      </VCol>
    </VRow>


    
    <VRow>
      <VCol cols="12">
        <VCard title="Movimientos">
          <VCardText>
            <VDataTable
              :headers="headersMovimientos"
              :items="movimientos"
              class="tabla-movimientos"
              density="compact"
              hide-default-footer
              :items-per-page="movimientos.length || 10"
              fixed-header
              :style="{ fontSize: '14px', maxHeight: movimientos.length ? '600px' : 'auto' }"
              @click:row="onRowClick"
              hover
              >

              <!-- mostrar a la izquierda -->
              <template #item.cuenta="{ item }">
                <div class="text-left">{{ item.raw?.cuenta ?? item.cuenta }}</div>
              </template>


              <template #item.descripcion="{ item }">
                <div class="text-left">{{ item.raw?.descripcion ?? item.descripcion }}</div>
              </template>

              <template #item.referencia="{ item }">
                <div class="text-left">{{ item.raw?.referencia ?? item.referencia }}</div>
              </template>

              <template #item.concepto="{ item }">
                <div class="text-left">{{ item.raw?.concepto ?? item.concepto }}</div>
              </template>

              <template #item.periodoLiq="{ item }">
                <div class="text-left">{{ item.raw?.periodoLiq ?? item.periodoLiq }}</div>
              </template>

              <!-- mostrar a la derecha -->
              <template #item.cargo="{ item }">
                <div class="text-right">{{ (item.raw?.cargo ?? item.cargo).toLocaleString("es-MX", { style: "currency", currency: "MXN" }) }}</div>
              </template>

              <template #item.abono="{ item }">
                <div class="text-right"> {{ (item.raw?.abono ?? item.abono).toLocaleString("es-MX", { style: "currency", currency: "MXN" }) }}</div>
              </template>

              <template #body.append>
                <tr>
                  <td colspan="7" class="text-right font-weight-bold"><strong>Totales:</strong></td>
                  <td class="text-right font-weight-bold">{{ totales.TotalCargo.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) }}</td>
                  <td class="text-right font-weight-bold">{{ totales.TotalAbono.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) }}</td>
                  <td></td>
                </tr>
              </template>
            </VDataTable>

            <VRow justify="end" class="mt-2">
              <VCol cols="auto" class="text-right text-body-2">
                <div><strong>Diferencia:</strong> {{ totales.Diferencia.toLocaleString("es-MX", { style: "currency", currency: "MXN" }) }}</div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    
    <VRow>
      <VCol cols="12">
        <VCard title="Movimientos de Póliza">
          <VCardText>
            <!-- A partir de aqui es el formulario -->
            <VForm @submit.prevent="() => {}">
            
              <VRow>
                <VCol cols="12" md="2" >
                  <VBtn block color="primary" @click="guardarMovPoliza" :disabled="isPolizaBloqueada || isMovimientoEnCaja || !validacionMovimientoEsModificable">
                    <VIcon class="me-2" icon="tabler-device-floppy" />
                    Guardar
                  </VBtn>
                </VCol>

                <VCol cols="6" md="2" >
                  <VBtn block color="primary" @click="nuevoMovPoliza(0)" :disabled="isPolizaBloqueada"> 
                    <VIcon class="me-2" icon="tabler-file-plus" />
                    Nuevo
                  </VBtn>
                </VCol>

                <VCol cols="6" md="2" >
                  <VBtn block color="primary" @click="borrarMovPoliza" :disabled="isPolizaBloqueada || isMovimientoEnCaja || !validacionMovimientoEsModificable">
                    <VIcon class="me-2" icon="tabler-trash" />
                    Borrar
                  </VBtn>
                </VCol>

                <VCol cols="6" md="2" >
                  <VBtn 
                    block 
                    color="primary" 
                    @click="anteriorMovPoliza"
                    :disabled="movimientos.length === 0 || movimientoMovPoliza <= 1"
                  >
                    <VIcon class="me-2" icon="tabler-chevron-left" />
                    Anterior
                  </VBtn>
                </VCol>

                <VCol cols="6" md="2" >
                  <VBtn 
                    block 
                    color="primary" 
                    @click="siguienteMovPoliza"
                    :disabled="movimientos.length === 0 || movimientoMovPoliza >= movimientos.length"
                  >
                    <VIcon class="me-2" icon="tabler-chevron-right" />
                    Siguiente 
                  </VBtn>
                </VCol>
              </VRow>

              <VDivider class="mt-5 mb-5"/>

              <VRow>
                 <!-- Movimiento -->
                <VCol cols="12" md="3" class="d-flex flex-wrap gap-4 comprimir-col">
                  <div class="mt-2">Movimiento: </div>
                  <AppTextField
                    v-model="movimientoMovPoliza"
                    readonly
                  />
                </VCol>
                
                <VCol cols="12" md="3" class="d-flex flex-wrap gap-4 comprimir-col">
                  <div class="mt-2">Insertar en Posición: </div>
                  <AppTextField
                    v-model="posicionMovPoliza"
                    @input="filtrarNumericos"
                    @focus="seleccionarTodo"
                    :readonly="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable || !isNuevoMovimiento"
                  />
                </VCol>

                
                <VCol cols="12" md="3" class="d-flex align-center comprimir-col">
                  <VCheckbox
                    v-model="fijarReferenciaConceptoMovPoliza"
                    label="Fijar Referencia y Concepto"
                  />
                </VCol>

                <VCol cols="12" md="3" class="d-flex align-center comprimir-col">
                  <VCheckbox
                    v-model="fijarCuentaMovPoliza"
                    label="Fijar Cuenta"
                  />
                </VCol>
              
              </VRow>

              <VRow >
                <VCol cols="12" md="7">
                  <VRow>
                    <VCol  cols="12" md="2" class="d-flex align-center justify-start justify-lg-end">
                      <div>* Cuenta: </div>
                    </VCol>
                    <VCol cols="12" md="9">
                      <VRow>
                        <VCol cols="12" md="3">
                          <AppTextField
                            v-model="cuenta1MovPoliza"
                            @blur="onBlurCuenta1"
                            @input="filtrarNumericos"
                            :readonly="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                          />
                        </VCol>
                        <VCol cols="12" md="3">
                          <AppTextField
                            v-model="cuenta2MovPoliza"
                            @blur="onBlurCuenta2"
                            @input="filtrarNumericos"
                            :readonly="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                          />

                        </VCol>
                        <VCol cols="12" md="3">
                          <AppTextField
                            v-model="cuenta3MovPoliza"
                            @blur="onBlurCuenta3"
                            @input="filtrarNumericos"
                            :readonly="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                          />
                        </VCol>
                        <VCol cols="12" md="3">
                          <AppTextField
                            v-model="cuenta4MovPoliza"
                            @blur="onBlurCuenta4"
                            @input="filtrarNumericos"
                            :readonly="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                          />
                        </VCol>
                      </VRow>
                    </VCol>
                    <VCol cols="12" md="1">
                      <VBtn 
                        color="primary" @click="abrirModal" 
                        :disabled="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                        block
                      >
                      ...
                      </VBtn>
                    </VCol>
                  </VRow>

                  <SeleccionarCuentaContable
                    v-model="modalVisible"
                    title="Seleccionar cuenta contable"
                    @submit="seleccionarCuentaContableSwal"
                    :cuentas-iniciales="cuentasParaModal"
                  />

                </VCol>
              </VRow>

              <VRow>
                 <!-- Descripcion -->
                <VCol cols="12" md="1"></VCol>
                <VCol cols="12" md="7" class="comprimir-col">
                  <AppTextField
                    v-model="descripcionMovPoliza"
                    readonly
                    label="Descripción"
                    :style="{
                      'background-color': isDarkTheme ? 'var(--color-mustard-dark)' : 'var(--color-mustard-light)',
                      'border-radius': '5px',
                      'color': isDarkTheme ? 'var(--text-color-dark)' : 'var(--text-color-light)'
                    }"
                  />
                </VCol>
              </VRow>

              <VRow>
                  <!-- Cargo y Abono -->
                <VCol cols="12" md="6">
                  <VRow>
                    <!-- Cargo-->
                    <VCol cols="12" md="12" class="d-flex flex-wrap gap-4 comprimir-col">
                      <AppTextField
                          v-model="viewCargoMovPoliza"
                          label="* Cargo"
                          @input="onCargoInput" 
                          @focus="seleccionarTodo"
                          @blur="onBlurCargoMovPoliza()"
                          :readonly="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                      >
                        <template #prepend-inner>
                            <span class="text-medium-emphasis me-1">$</span> 
                        </template>
                      </AppTextField>
                      <div class="mt-6">Pesos</div>
                  </VCol>

                  <VCol cols="12" md="4" class="comprimir-col"></VCol>
                  <!-- Abono-->
                    <VCol cols="12" md="8" class="d-flex flex-wrap gap-4 comprimir-col">
                      <AppTextField
                          v-model="viewAbonoMovPoliza"
                          label="* Abono"
                          @input="onAbonoInput"
                          @focus="seleccionarTodo"
                          @blur="onBlurAbonoMovPoliza()"
                          :readonly="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                      >
                          <template #prepend-inner>
                              <span class="text-medium-emphasis me-1">$</span>
                          </template>
                      </AppTextField>
                      <div class="mt-6">Pesos</div>
                    </VCol>
                  </VRow>
                </VCol>

                
                <!-- Sumas y Diferencia-->
                <VCol cols="12" md="6">
                  <VRow>
                    <VCol cols="12" md="6" class="comprimir-col">
                      <AppTextField
                        :value="totales.TotalCargo.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })"
                        label="* Sumas Iguales: "
                        readonly
                        :style="{
                          'background-color': isDarkTheme ? 'var(--color-mustard-dark)' : 'var(--color-mustard-light)',
                          'border-radius': '5px',
                          'color': isDarkTheme ? 'var(--text-color-dark)' : 'var(--text-color-light)'
                        }"
                      />
                    </VCol>
                    <VCol cols="12" md="6" class="comprimir-col">
                      <AppTextField
                        :value="totales.TotalAbono.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })"
                        label="ㅤ"
                        readonly
                        :style="{
                          'background-color': isDarkTheme ? 'var(--color-mustard-dark)' : 'var(--color-mustard-light)',
                          'border-radius': '5px',
                          'color': isDarkTheme ? 'var(--text-color-dark)' : 'var(--text-color-light)'
                        }"
                      />
                    </VCol>

                    <VCol cols="12" md="6" class="d-flex flex-wrap gap-4 comprimir-col">
                      <AppTextField
                        :value="totales.Diferencia.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })"
                        label="* Diferencia: "
                        readonly
                        :style="{
                          'background-color': isDarkTheme ? 'var(--color-mustard-dark)' : 'var(--color-mustard-light)',
                          'border-radius': '5px',
                          'color': isDarkTheme ? 'var(--text-color-dark)' : 'var(--text-color-light)'
                        }"
                      />
                    </VCol>
                  </VRow>
                </VCol>
              </VRow>

              
              <VRow>
                 <!-- Referencia y Concepto -->
                <VCol cols="12" md="6" class="">
                  <VRow>
                    <VCol cols="12" md="12" class="comprimir-col">
                      <AppTextField
                        v-model="referenciaMovPoliza"
                        label="Referencia"
                        :readonly="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                      />
                    </VCol>
                  </VRow>

                  <VRow>
                    <VCol cols="12" md="12" class="comprimir-col">
                      <AppTextarea
                        v-model="conceptoMovPoliza"
                        label="Concepto"
                        rows="2"
                        no-resize
                        :readonly="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                      />
                    </VCol>
                  </VRow>
                </VCol>

                <!-- Periodo y Ejercicio de Liquidación -->
                <VCol cols="12" md="6">
                  <VRow>
                    <VCol cols="12" md="12" class="d-flex flex-wrap gap-4 comprimir-col">
                      <AppSelect
                        v-model="periodoLiqMovPoliza"
                        label="Periodo de Liquidación"
                        :items="mesesMovPoliza"
                        item-title="text"
                        item-value="value"
                        variant="filled"
                        :readonly="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                      />
                      <div class="mt-6">* Periodo de Aplicación en Caja</div>
                    </VCol> 
                  </VRow>

                  <VRow>
                    <VCol cols="12" md="12" class="d-flex flex-wrap gap-4 comprimir-col">
                      <AppSelect
                        v-model="ejercicioLiqMovPoliza"
                        :items="yearMovPoliza"
                        label="Ejercicio de Liquidación"
                        item-title="text"   
                        item-value="value" 
                        variant="filled"
                        :readonly="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                      />
                      <div class="mt-6">* Ejercicio de Aplicación en Caja</div>
                    </VCol>
                  </VRow>
                  
                  <VRow>
                    <VCol cols="12" md="12" class="d-flex flex-wrap gap-4 comprimir-col">
                      
                      <div class="">{{ liqSeleccionado }}</div>
                    </VCol>
                  </VRow>
                </VCol>
              </VRow> 
                 <!-- Referencia y Periodo de Liquidación -->
                

              <VDivider class="mt-5 mb-5"/>

              <VRow>
                <VCol cols="6" md="2" class="comprimir-col" v-if="hasRole('303B3E0A-FB7A-4E6C-9757-E33E6FD8D265')">
                  <VCheckbox
                    v-model="aLiquidarMovPoliza"
                    label="A Liquidar"
                    :disabled="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                  />
                </VCol>

                <VCol cols="6" md="2" class="comprimir-col" v-if="hasRole('303B3E0A-FB7A-4E6C-9757-E33E6FD8D265')">
                  <VCheckbox
                    v-model="facturadoMovPoliza"
                    label="Facturado"
                    :disabled="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                  />
                </VCol>

                <VCol cols="6" md="2" class="comprimir-col" v-if="hasRole('303B3E0A-FB7A-4E6C-9757-E33E6FD8D265')">
                  <VCheckbox
                    v-model="esImpuestoMovPoliza"
                    label="Es Impuesto"
                    :disabled="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                  />
                </VCol>

                <VCol cols="6" md="2" class="comprimir-col" v-if="hasRole('303B3E0A-FB7A-4E6C-9757-E33E6FD8D265')">
                  <VCheckbox
                    v-model="esSeguroMovPoliza"
                    label="Es Seguro"
                    :disabled="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                  />
                </VCol>
                
                <VCol cols="6" md="2" class="comprimir-col" v-if="hasRole('303B3E0A-FB7A-4E6C-9757-E33E6FD8D265')">
                  <VCheckbox
                    v-model="esRentaMovPoliza"
                    label="Es Renta"
                    :disabled="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                  />
                </VCol>
                
                <VCol cols="6" md="2" class="comprimir-col" v-if="hasRole('303B3E0A-FB7A-4E6C-9757-E33E6FD8D265')">
                  <VCheckbox
                    v-model="esAutomaticoMovPoliza"
                    label="Es Automático"
                    :disabled="isMovimientoEnCaja || isPolizaBloqueada || !validacionMovimientoEsModificable"
                  />
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


  <SeleccionarPoliza
    v-model="modalSeleccionarPolizaVisible"
    title="Seleccionar Póliza"
    @submit="seleccionarPolizaSwal"
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


