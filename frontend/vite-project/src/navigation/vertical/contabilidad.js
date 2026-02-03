export default  [
  {
    title: 'Contabilidad',
    icon: { icon: 'tabler-cash' },
    permisoId: '7BA6B3E5-AC4C-4395-B630-56C96F0C0861',
    children: [
      {
        title: 'Administrar Pólizas',
        to: 'contabilidad-administrar-polizas',
        icon: { icon: 'tabler-file-text' },
        // show: userPermissions.permisos.includes('0C3EC16C-91F2-4197-AA73-6F1399F487AF-QUITAR'), // ID del permiso para administrar pólizas
        permisoId: '0C3EC16C-91F2-4197-AA73-6F1399F487AF'
      },
      {
        title: 'Generar Abono en Caja',
        to: null,
        icon: { icon: 'tabler-currency-dollar' },
        permisoId: 'A2659FBB-ADF5-42A1-92C6-E08B1BEBFBCC'
      },
      {
        title: 'Validar Póliza',
        to: null,
        icon: { icon: 'tabler-check' },
        permisoId: '9FD6E670-6AD6-4166-8BBC-6F0C73B151A8'
      },
      {
        title: 'Cambiar Periodos',
        to: null,
        icon: { icon: 'tabler-calendar' },
        permisoId: '5AC6C68C-A69E-431B-B8E7-08BA4E0B3FA1'
      },
      {
        title: 'Registrar Traspaso de Auxiliares',
        to: null,
        icon: { icon: 'tabler-arrows-right-left' },
        permisoId: 'DCE3AA6D-4C44-4039-AD75-E6A1A5B6F449'
      },
      {
        title: 'Exportar Pólizas a ContPAQi',
        to: null,
        icon: { icon: 'tabler-file-export' },
        permisoId: '64346D96-4B3A-4C46-A658-632BC0C1A8B8'
      },
      {
        title: 'Administrar Cuentas Contables',
        to: null,
        icon: { icon: 'tabler-books' },
        permisoId: '03ED4980-7189-426B-B33D-BD51582C118F'
      },
      {
        title: 'Cerrar Periodos',
        to: null,
        icon: { icon: 'tabler-calendar-off' },
        permisoId: 'EFEBC864-B7B7-4047-BA32-52DA0FD88045'
      },
      {
        title: 'Cerrar Ejercicio Anual',
        to: null,
        icon: { icon: 'tabler-calendar-check' },
        permisoId: '10D2E2D4-0285-4B09-B3F1-B9B8A89E6194'
      },
      {
        title: 'Reportes',
        icon: { icon: 'tabler-report' },
        children: [
          {
            title: 'Movimientos Auxiliares',
            icon: { icon: 'tabler-file-invoice' },
            permisoId: 'F3FD3E15-AFD8-4E17-98C2-EE6B191CD38A',
            to: { query: { modal: 'movimientosAuxiliares' } }, 
            class: 'nav-no-active',
          },
          {
            title: 'Anexos de Catálogos',
            to: null,
            icon: { icon: 'tabler-folder' },
            permisoId: '6FFB2301-0C46-4C28-AC67-2BE64DB771C7'
          },
          {
            title: 'Movimientos Auxiliares de Intereses',
            to: null,
            icon: { icon: 'tabler-arrows-sort' },
            permisoId: '46E30D3F-F9D4-4049-9868-5174E2E86054'
          },
        ],
      },
    ]
  }
]
