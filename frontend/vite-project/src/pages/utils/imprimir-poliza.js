import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx'; 


const itemsTipoPoliza = [
    { value: 1, text: 'Diario' },
    { value: 2, text: 'Egreso' },
    { value: 3, text: 'Ingreso' },
];

const meses = [
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
];

const formatMoneda = (valor) => {
    const numero = parseFloat(valor || 0);
    return `$${numero.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
};

const formatFechaPoliza = (dateInput) => {
    if (!dateInput) return '';
    
    if (dateInput instanceof Date) {
        return dateInput.toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    }
    return String(dateInput);
};


/**
 * Genera el documento PDF de la Póliza Contable.
 * @param {object} datosPoliza - Objeto con datos de la póliza.
 * @returns {Promise<boolean>} - Retorna true si fue exitoso, false si falló.
 */
export const generarPDFPoliza = async (datosPoliza) => { 
    
    // console.log("--> INICIO GENERACIÓN PDF. Datos recibidos:", datosPoliza);

    try {
        if (!datosPoliza) throw new Error("No se recibieron datos para la póliza (objeto nulo).");
        if (!datosPoliza.movimientos) console.warn("Advertencia: No hay movimientos en los datos de la póliza.");

        const fechaFormateada = formatFechaPoliza(datosPoliza.fecha);

        const doc = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'letter'
        });

        const margin = 40;
        let y = margin;
        const pageWidth = doc.internal.pageSize.getWidth();
        
        const tipoTexto = itemsTipoPoliza.find(t => t.value === parseInt(datosPoliza.tipo))?.text || '';
        const fechaGeneracion = new Date().toLocaleString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
        const periodoTexto = meses.find(m => m.value === datosPoliza.periodo)?.text || '';



        // 1. ENCABEZADO Y TÍTULO

        // Empresa y Fecha/Hora
        doc.setFontSize(10);
        doc.text("CASA ADMINISTRACIONES", margin, y);
        doc.text(fechaGeneracion, pageWidth - margin, y, { align: 'right' });
        y += 15;

        // Divisor
        doc.line(margin, y, pageWidth - margin, y);
        y += 20;

        // Título Principal
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text("PÓLIZA CONTABLE", pageWidth / 2, y, { align: 'center' });
        doc.setFont(undefined, 'normal');
        y += 20;


        // 2. TABLA DE DATOS GENERALES (CABECERA)

        const headerData = [
            fechaFormateada,
            periodoTexto,
            datosPoliza.ejercicio,
            `${tipoTexto}`,
            datosPoliza.numero,
            datosPoliza.concepto,
        ];

        const runAutoTable = (docInstance, options) => {
             const tablePlugin = autoTable.default || autoTable;
             if (typeof tablePlugin === 'function') {
                 tablePlugin(docInstance, options);
             } else {
                 throw new Error("El plugin jspdf-autotable no se cargó correctamente.");
             }
        };

        runAutoTable(doc, {
            startY: y,
            head: [[
                'Fecha', 'Período', 'Ejercicio Contable', 'Tipo', 'Número', 'Nombre Póliza'
            ]],
            body: [headerData],
            theme: 'grid',
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [230, 230, 230], fontSize: 8, halign: 'center', textColor: 20 },
            bodyStyles: { fontSize: 8 },
            didParseCell: (data) => {
                 if (data.section === 'body') {
                     data.cell.styles.lineWidth = 0.5;
                 }
            }
        });

        y = (doc.lastAutoTable?.finalY || y) + 15;
        

        // 3. TABLA DE MOVIMIENTOS CONTABLES (CUERPO)

        doc.setFontSize(10);
        doc.text("Movimientos Contables:", margin, y);
        y += 10;

        const movementsBody = (datosPoliza.movimientos || []).map(mov => [
            mov.num,
            mov.referencia,
            mov.cuenta,
            mov.concepto,
            formatMoneda(mov.cargo),
            formatMoneda(mov.abono)
        ]);
        
        const columnStyles = {
            0: { cellWidth: 30, halign: 'center' },
            4: { halign: 'right', fontStyle: 'bold' }, 
            5: { halign: 'right', fontStyle: 'bold' }  
        };

        runAutoTable(doc, {
            startY: y,
            head: [['No.', 'Referencia', 'Cuenta', 'Concepto', 'Cargo', 'Abono']],
            body: movementsBody,
            theme: 'grid',
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [200, 200, 200], fontSize: 9, halign: 'center', textColor: 20 },
            bodyStyles: { fontSize: 8 },
            columnStyles: columnStyles,
        });


        // 4. TOTALES

        y = doc.lastAutoTable?.finalY || y;
        
        const totalCargoFinal = formatMoneda(datosPoliza.totalCargo);
        const totalAbonoFinal = formatMoneda(datosPoliza.totalAbono);
        
        runAutoTable(doc, {
            startY: y,
            body: [['Total Póliza', totalCargoFinal, totalAbonoFinal]],
            theme: 'plain', 
            margin: { left: margin, right: margin },
            columnStyles: {
                0: { halign: 'right', cellWidth: 'auto', fontStyle: 'bold' }, 
                1: { halign: 'right', cellWidth: 70, fontStyle: 'bold' },
                2: { halign: 'right', cellWidth: 70, fontStyle: 'bold' }
            },
            styles: { fontSize: 10, cellPadding: 5 },
            didDrawCell: (data) => {
                if (data.row.index === 0 && (data.column.index === 1 || data.column.index === 2)) {
                    doc.setLineWidth(1); 
                    doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                }
            }
        });

        // 5. GUARDAR ARCHIVO
        const fileName = `Poliza_${datosPoliza.numero || 'S/N'}_${fechaFormateada.replace(/\//g, '-')}.pdf`;
        doc.save(fileName);

        // console.log("--> PDF Generado con éxito.");
        return true;

    } catch (error) {
        console.error("Error grave durante la generación del PDF:", error);
        return false;
    }
};



/**
 * Genera el documento Excel (.xlsx) de la Póliza Contable.
 * @param {object} datosPoliza - Objeto con datos de la póliza.
 * @returns {Promise<boolean>}
 */
export const generarExcelPoliza = async (datosPoliza) => {
    // console.log("--> INICIO GENERACIÓN EXCEL. Datos recibidos:", datosPoliza);

    try {
        if (!datosPoliza) throw new Error("Datos nulos para Excel.");

        const fechaFormateada = formatFechaPoliza(datosPoliza.fecha);
        const tipoTexto = itemsTipoPoliza.find(t => t.value === parseInt(datosPoliza.tipo))?.text || '';
        const periodoTexto = meses.find(m => m.value === datosPoliza.periodo)?.text || '';
        const fechaGeneracion = new Date().toLocaleString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });

        // 1. CONSTRUCCIÓN DEL EXCEL
        const ws_data = [
            ["CASA ADMINISTRACIONES"],
            ["PÓLIZA CONTABLE"],
            [`Fecha de Generación: ${fechaGeneracion}`],
            [], // Espacio separador    
            
            ["Fecha", "Período", "Ejercicio", "Tipo", "Número", "Concepto"], 
            [
                fechaFormateada,
                periodoTexto,
                datosPoliza.ejercicio,
                `${tipoTexto}`,
                datosPoliza.numero,
                datosPoliza.concepto
            ],
            [], // Espacio separador
            
            ["No.", "Cuenta", "Descripcion", "Referencia", "Concepto", "Periodo Liq", "Ejercicio Liq", "Cargo", "Abono", "Liq"]
        ];

        // 2. Movimientos
        (datosPoliza.movimientos || []).forEach(mov => {
            ws_data.push([
                mov.num,
                mov.cuenta,
                mov.descripcion || '', 
                mov.referencia,
                mov.concepto,
                mov.periodoLiq || '',
                mov.ejercicioLiq || '',
                parseFloat(mov.cargo || 0), 
                parseFloat(mov.abono || 0), 
                mov.liq || ''          
            ]);
        });

        // 3. Totales
        const filaTotales = new Array(10).fill("");
        filaTotales[6] = "TOTALES:"; 
        filaTotales[7] = parseFloat(datosPoliza.totalCargo || 0);
        filaTotales[8] = parseFloat(datosPoliza.totalAbono || 0);
        ws_data.push(filaTotales);

        // 4. Crear Libro y Hoja
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Póliza");

        // Ancho de columnas 
        const wscols = [
            { wch: 8 },  // No.
            { wch: 45 }, // Cuenta
            { wch: 45 }, // Descripcion
            { wch: 30 }, // Referencia
            { wch: 45 }, // Concepto
            { wch: 12 }, // Per Liq
            { wch: 12 }, // Ejer Liq
            { wch: 15 }, // Cargo
            { wch: 15 }, // Abono
            { wch: 10 }  // Liq
        ];
        ws['!cols'] = wscols;

        // 5. Descargar Archivo
        const fileName = `Poliza_${datosPoliza.numero || 'SN'}_${fechaFormateada.replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(wb, fileName);

        return true;

    } catch (error) {
        console.error("Error al generar Excel:", error);
        return false;
    }
};