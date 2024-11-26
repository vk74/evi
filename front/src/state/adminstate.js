/**
 * adminstate.js
 * Хранилище состояния для модуля администрирования.
 * Управляет состоянием активного подмодуля и режимом отображения бокового меню.
 */
import { defineStore } from 'pinia';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    activeSubModule: 'SubModuleServiceAdmin',
    drawerMode: 'auto', // Режимы: 'auto', 'opened', 'closed'
    previousModule: null, // Для хранения предыдущего модуля
  }),

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
  },
});