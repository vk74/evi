/**
 * state.catalog.admin.ts
 * Хранилище состояния для модуля управления каталогом
 */
import { defineStore } from 'pinia'
import type { CatalogAdminState, CatalogSectionId } from './types.catalog.admin'

export const useCatalogAdminStore = defineStore('catalog-admin', {
  state: (): CatalogAdminState => ({
    activeSection: 'settings'
  }),

  getters: {
    /**
     * Получение текущей активной секции
     */
    getCurrentSection(): CatalogSectionId {
      return this.activeSection
    }
  },

  actions: {
    /**
     * Установка активной секции
     */
    setActiveSection(sectionId: CatalogSectionId) {
      this.activeSection = sectionId
    }
  },

  persist: true
})