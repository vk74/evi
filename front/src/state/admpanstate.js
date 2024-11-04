import { defineStore } from 'pinia';

export const useAdmpanStore = defineStore('admpan', {
  state: () => ({
    activeSubModule: 'SubModuleServiceAdm',
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