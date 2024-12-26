/**
 * appstate.js
 * Хранилище состояния для главного навигационного меню приложения.
 * Управляет навигацией между основными модулями, режимами отображения drawer
 * и сохраняет состояния между сессиями пользователя.
 */
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', {
  state: () => ({
    activeModule: 'Catalog', // Текущий активный модуль по умолчанию
    previousModule: null, // Предыдущий активный модуль
    drawerMode: 'auto', // Режимы: 'auto', 'opened', 'closed'
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
     * Сброс состояния хранилища
     */
    resetState() {
      this.activeModule = 'Catalog';
      this.previousModule = null;
      this.drawerMode = 'auto';
    }
  },

  persist: {
    enabled: true,
    strategies: [
      {
        key: 'app-navigation-store',
        storage: localStorage,
        paths: ['activeModule', 'drawerMode']
      }
    ]
  }
});