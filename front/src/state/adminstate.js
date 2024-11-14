// storage for admin module state

import { defineStore } from 'pinia';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    activeSubModule: 'SubModuleServiceAdmin',
    isPinned: false,
    previousModule: null, // Добавляем состояние для хранения предыдущего модуля
  }),
  actions: {
    setActiveSubModule(module) {
      if (this.activeSubModule !== module) {
        this.previousModule = this.activeSubModule;
        this.activeSubModule = module;
      }
    },
    setIsPinned(value) {
      this.isPinned = value;
    },
    returnToPreviousModule() {
      if (this.previousModule) {
        this.activeSubModule = this.previousModule;
        this.previousModule = null;
      }
    },
  },
});