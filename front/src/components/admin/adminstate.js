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

    /**
     * Получение текущей активной секции настроек приложения
     * @returns {string} ID активной секции настроек
     */
        getCurrentAppSection: (state) => state.activeAppSection,
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
    },

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
     * Установка активного подмодуля редактирования пользователей
     * @param {'SubModuleUserEditor' | 'SubModuleGroupEditor' | null} subModule - Имя подмодуля для активации
     */
    setActiveUserSubModule(subModule) {
      this.activeUserSubModule = subModule;
    },

    /**
     * Сброс активного подмодуля редактирования пользователей
     */
    resetActiveUserSubModule() {
      this.activeUserSubModule = null;
    },

    /**
     * Сброс всех состояний модуля управления пользователями
     */
    resetUserModuleState() {
      this.activeUserSection = 'users';
      this.previousUserSection = null;
      this.activeUserSubModule = null;
    },

    /**
     * Сброс всех состояний модуля управления каталогом
     */
    resetCatalogModuleState() {
      this.activeCatalogSection = 'settings';
      this.previousCatalogSection = null;
    },

    /**
     * Сброс всех состояний модуля управления сервисами
     */
    resetServiceModuleState() {
      this.activeSection = 'active-services';
      this.previousSection = null;
    },

    /**
     * Полный сброс всех состояний хранилища
     */
    resetAllState() {
      this.activeSubModule = 'SubModuleServiceAdmin';
      this.drawerMode = 'auto';
      this.previousModule = null;
      this.resetServiceModuleState();
      this.resetCatalogModuleState();
      this.resetUserModuleState();
    },

    /**
     * Установка активной секции в модуле настроек приложения
     * @param {'settings' | 'visualization'} sectionId - ID секции настроек для активации
     */
    setActiveAppSection(sectionId) {
    if (this.activeAppSection !== sectionId) {
        this.previousAppSection = this.activeAppSection;
        this.activeAppSection = sectionId;
    }
    },

    /**
     * Возврат к предыдущей активной секции настроек приложения
     */
    returnToPreviousAppSection() {
    if (this.previousAppSection) {
        this.activeAppSection = this.previousAppSection;
        this.previousAppSection = null;
    }
    },

    /**
     * Сброс всех состояний модуля настроек приложения
     */
    resetAppModuleState() {
    this.activeAppSection = 'settings';
    this.previousAppSection = null;
    },

    /**
     * Полный сброс всех состояний хранилища
     */
    // eslint-disable-next-line no-dupe-keys
    resetAllState() {
    this.activeSubModule = 'SubModuleServiceAdmin';
    this.drawerMode = 'auto';
    this.previousModule = null;
    this.resetServiceModuleState();
    this.resetCatalogModuleState();
    this.resetUserModuleState();
    this.resetAppModuleState();
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'admin-store',
        storage: localStorage,
        paths: [
          'drawerMode',
          'activeSubModule',
          'activeSection',
          'activeCatalogSection',
          'activeUserSection',
          'activeUserSubModule',
          'activeAppSection'
        ]
      }
    ]
  }
});