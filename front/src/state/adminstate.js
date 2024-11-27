/**
 * adminstate.js
 * Хранилище состояния для модуля администрирования.
 * Управляет состоянием активного подмодуля, режимом отображения бокового меню
 * и активными секциями в модулях управления сервисами и каталогом.
 * Обеспечивает сохранение состояния между сессиями пользователя.
 */
import { defineStore } from 'pinia';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    activeSubModule: 'SubModuleServiceAdmin',
    drawerMode: 'auto', // Режимы: 'auto', 'opened', 'closed'
    previousModule: null, // Для хранения предыдущего модуля
    activeSection: 'active-services', // Активная секция в модуле управления сервисами
    previousSection: null, // Для хранения предыдущей секции
    // Новые состояния для каталога
    activeCatalogSection: 'settings', // Активная секция в модуле управления каталогом
    previousCatalogSection: null, // Для хранения предыдущей секции каталога
  }),

  getters: {
    /**
     * Получение текущей активной секции сервисов
     * @returns {string} ID активной секции сервисов
     */
    getCurrentSection: (state) => state.activeSection,

    /**
     * Получение текущей активной секции каталога
     * @returns {string} ID активной секции каталога
     */
    getCurrentCatalogSection: (state) => state.activeCatalogSection,
  },

  actions: {
    /**
     * Установка активного подмодуля с сохранением предыдущего состояния
     * @param {string} module - Имя модуля для активации
     */
    setActiveSubModule(module) {
      if (this.activeSubModule !== module) {
        this.previousModule = this.activeSubModule;
        this.activeSubModule = module;
      }
    },

    /**
     * Установка режима отображения бокового меню
     * @param {'auto' | 'opened' | 'closed'} mode - Новый режим отображения
     */
    setDrawerMode(mode) {
      if (['auto', 'opened', 'closed'].includes(mode)) {
        this.drawerMode = mode;
      } else {
        console.warn('Invalid drawer mode:', mode);
      }
    },

    /**
     * Возврат к предыдущему активному модулю
     */
    returnToPreviousModule() {
      if (this.previousModule) {
        this.activeSubModule = this.previousModule;
        this.previousModule = null;
      }
    },

    /**
     * Установка активной секции в модуле управления сервисами
     * @param {'active-services' | 'all-services'} sectionId - ID секции для активации
     */
    setActiveSection(sectionId) {
      if (this.activeSection !== sectionId) {
        this.previousSection = this.activeSection;
        this.activeSection = sectionId;
      }
    },

    /**
     * Возврат к предыдущей активной секции сервисов
     */
    returnToPreviousSection() {
      if (this.previousSection) {
        this.activeSection = this.previousSection;
        this.previousSection = null;
      }
    },

    /**
     * Установка активной секции в модуле управления каталогом
     * @param {'settings' | 'visualization' | 'access'} sectionId - ID секции каталога для активации
     */
    setActiveCatalogSection(sectionId) {
      if (this.activeCatalogSection !== sectionId) {
        this.previousCatalogSection = this.activeCatalogSection;
        this.activeCatalogSection = sectionId;
      }
    },

    /**
     * Возврат к предыдущей активной секции каталога
     */
    returnToPreviousCatalogSection() {
      if (this.previousCatalogSection) {
        this.activeCatalogSection = this.previousCatalogSection;
        this.previousCatalogSection = null;
      }
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'admin-store',
        storage: localStorage,
        paths: ['drawerMode', 'activeSubModule', 'activeSection', 'activeCatalogSection']
      }
    ]
  }
});