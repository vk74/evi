/**
 * state.app.admin.ts
 * Хранилище состояния для модуля настроек приложения.
 * Управляет состоянием активной секции в модуле SubModuleAppAdmin.
 */
import { defineStore } from 'pinia'
import type { AppAdminState, AppSectionId } from './types.app.admin'

export const useAppAdminStore = defineStore('app-admin', {
  state: (): AppAdminState => ({
    /**
     * Текущая активная секция в модуле настроек приложения
     */
    activeSection: 'settings'
  }),

  getters: {
    /**
     * Получение текущей активной секции
     */
    getCurrentSection(): AppSectionId {
      return this.activeSection
    }
  },

  actions: {
    /**
     * Установка активной секции
     */
    setActiveSection(sectionId: AppSectionId) {
      this.activeSection = sectionId
    }
  },

  persist: true
})