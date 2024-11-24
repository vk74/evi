// Store для управления состоянием модуля каталога
import { defineStore } from 'pinia'

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    // Активная секция в модуле каталога
    activeSection: 'section1',
    
    // Флаг загрузки данных
    isLoading: false,
    
    // Состояние ошибки
    error: null
  }),

  getters: {
    // Получение активной секции
    getCurrentSection: (state) => state.activeSection,
    
    // Проверка загрузки
    getLoadingState: (state) => state.isLoading,
    
    // Получение ошибки
    getError: (state) => state.error
  },

  actions: {
    // Установка активной секции
    setActiveSection(section) {
      this.activeSection = section
    },
    
    // Установка состояния загрузки
    setLoading(status) {
      this.isLoading = status
    },
    
    // Установка ошибки
    setError(error) {
      this.error = error
    },
    
    // Сброс ошибки
    clearError() {
      this.error = null
    }
  }
})