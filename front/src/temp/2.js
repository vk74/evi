/**
 * adminstate.js
 * Хранилище состояния для модуля администрирования.
 * Управляет состоянием активного подмодуля, режимом отображения бокового меню
 * и активными секциями в модулях управления сервисами, каталогом и пользователями.
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
    activeCatalogSection: 'settings', // Активная секция в модуле управления каталогом
    previousCatalogSection: null, // Для хранения предыдущей секции каталога
    // Новые состояния для управления пользователями
    activeUserSection: 'users', // Активная секция в модуле управления пользователями
    previousUserSection: null, // Для хранения предыдущей секции пользователей
    activeUserSubModule: null, // Для хранения активного подмодуля редактирования
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

    /**
     * Получение текущей активной секции управления пользователями
     * @returns {string} ID активной секции пользователей
     */
    getCurrentUserSection: (state) => state.activeUserSection,

    /**
     * Получение текущего активного подмодуля редактирования
     * @returns {string|null} Имя активного подмодуля редактирования
     */
    getCurrentUserSubModule: (state) => state.activeUserSubModule,
  },

  actions: {
    // ... существующие actions ...

    /**
     * Установка активной секции в модуле управления пользователями
     * @param {'users' | 'groups'} sectionId - ID секции пользователей для активации
     */
    setActiveUserSection(sectionId) {
      if (this.activeUserSection !== sectionId) {
        this.previousUserSection = this.activeUserSection;
        this.activeUserSection = sectionId;
      }
    },

    /**
     * Возврат к предыдущей активной секции пользователей
     */
    returnToPreviousUserSection() {
      if (this.previousUserSection) {
        this.activeUserSection = this.previousUserSection;
        this.previousUserSection = null;
      }
    },

    /**
     * Установка активного подмодуля редактирования
     * @param {'SubModuleUserEditor' | 'SubModuleGroupEditor' | null} subModule - Имя подмодуля для активации
     */
    setActiveUserSubModule(subModule) {
      this.activeUserSubModule = subModule;
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'admin-store',
        storage: localStorage,
        paths: ['drawerMode', 'activeSubModule', 'activeSection', 'activeCatalogSection', 'activeUserSection', 'activeUserSubModule']
      }
    ]
  }
});