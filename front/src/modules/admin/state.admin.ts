/**
 * @file state.admin.ts
 * Version: 1.0.0
 * Pinia store for managing admin module state.
 * Frontend file that handles active submodule management, drawer mode, and navigation state.
 */
import { defineStore } from 'pinia'
import type {
  AdminState,
  SubModuleId,
  DrawerMode
} from './types.admin'

export const useAdminStore = defineStore('admin', {
  state: (): AdminState => ({
    activeSubModule: 'SubModuleServiceAdmin',
    drawerMode: 'auto',
    previousModule: null
  }),

  actions: {
    setActiveSubModule(module: SubModuleId): void {
      if (this.activeSubModule !== module) {
        this.previousModule = this.activeSubModule
        this.activeSubModule = module
      }
    },

    setDrawerMode(mode: DrawerMode): void {
      if (['auto', 'opened', 'closed'].includes(mode)) {
        this.drawerMode = mode
      } else {
        console.warn('Invalid drawer mode:', mode)
      }
    },

    returnToPreviousModule(): void {
      if (this.previousModule) {
        this.activeSubModule = this.previousModule
        this.previousModule = null
      }
    },

    resetAllState(): void {
      this.activeSubModule = 'SubModuleServiceAdmin'
      this.drawerMode = 'auto'
      this.previousModule = null
    }
  },

  persist: true
})