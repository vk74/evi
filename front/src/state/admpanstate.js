// state/admpanstate.js
import { defineStore } from 'pinia';

export const useAdmpanStore = defineStore('admpan', {
  state: () => ({
    activeSubModule: 'SubModuleServiceAdm', // По умолчанию SubModuleServiceAdm активен
    isPinned: false, // Добавляем состояние для переключателя
  }),
  
  actions: {
    setActiveSubModule(module) {
      this.activeSubModule = module; // Записываем активный подмодуль
    },
    
    setIsPinned(value) {
      this.isPinned = value; // Записываем состояние переключателя
    },
  },
});