import { defineStore } from 'pinia'

export const useUiModalsStore = defineStore('uiModals', {
  state: () => ({
    movimientosAuxiliares: false,
  }),

  actions: {
    openMovimientosAuxiliares() {
      this.movimientosAuxiliares = true
    },
    closeMovimientosAuxiliares() {
      this.movimientosAuxiliares = false
    },
  },
})