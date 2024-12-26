/**
 * state.service.admin.ts
 * Хранилище состояния для модуля управления сервисами.
 * Управляет состоянием активной секции в модуле SubModuleServiceAdmin.
 */
import { defineStore } from 'pinia'
import type { ServiceAdminState, ServiceSectionId } from './types.service.admin'

export const useServiceAdminStore = defineStore('service-admin', {
  state: (): ServiceAdminState => ({
    /**
     * Текущая активная секция в модуле управления сервисами
     */
    activeSection: 'active-services'
  }),

  getters: {
    /**
     * Получение текущей активной секции
     */
    getCurrentSection(): ServiceSectionId {
      return this.activeSection
    }
  },

  actions: {
    /**
     * Установка активной секции
     */
    setActiveSection(sectionId: ServiceSectionId) {
      this.activeSection = sectionId
    }
  },

  persist: true
})