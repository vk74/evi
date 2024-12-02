/**
 * appstate.js
 * Хранилище состояния для главного навигационного меню приложения.
 * Управляет навигацией между основными модулями и сохраняет
 * активный модуль между сессиями пользователя.
 */
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    activeModule: 'Catalog', // Текущий активный модуль по умолчанию
    previousModule: null,    // Предыдущий активный модуль
    // Список всех доступных модулей для валидации
    availableModules: [
      'Catalog',
      'Work',
      'AR',
      'Admin',
      'XLS',
      'Account',
      'Settings',
      'Help',
      'Login',
      'NewUserRegistration'
    ]
  }),

  getters: {
    /**
     * Получение текущего активного модуля
     * @returns {string} Имя активного модуля
     */
    getCurrentModule: (state) => state.activeModule,

    /**
     * Проверка активности модуля
     * @param {string} moduleName - Имя модуля для проверки
     * @returns {boolean} true если модуль активен
     */
    isModuleActive: (state) => (moduleName) => {
      return state.activeModule === moduleName;
    }
  },

  actions: {
    /**
     * Установка активного модуля с сохранением предыдущего состояния
     * @param {string} moduleName - Имя модуля для активации
     */
    setActiveModule(moduleName) {
      if (this.availableModules.includes(moduleName) && this.activeModule !== moduleName) {
        this.previousModule = this.activeModule;
        this.activeModule = moduleName;
      }
    },

    /**
     * Возврат к предыдущему активному модулю
     */
    returnToPreviousModule() {
      if (this.previousModule) {
        const temp = this.activeModule;
        this.activeModule = this.previousModule;
        this.previousModule = temp;
      }
    },

    /**
     * Сброс состояния хранилища
     */
    resetState() {
      this.activeModule = 'Catalog';
      this.previousModule = null;
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'app-navigation-store',
        storage: localStorage,
        paths: ['activeModule']
      }
    ]
  }
});