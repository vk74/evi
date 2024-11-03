// state/admpanstate.js
import { defineStore } from 'pinia';

export const useAdmpanStore = defineStore('admpan', {
  state: () => ({
    activeSubModule: 'SubModuleServiceAdm', // По умолчанию SubModuleServiceAdm активен
  }),
  actions: {
    setActiveSubModule(module) {
      this.activeSubModule = module; // Записываем активный подмодуль
    },
  },
});