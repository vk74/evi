/*
* Store для управления состоянием модуля каталога.
* Обеспечивает хранение и управление данными сервисов.
*
* Основные функции:
* - Загрузка списка сервисов из API
* - Хранение списка загруженных сервисов
* - Загрузка детальной информации о сервисах
* - Управление состоянием загрузки и ошибками
* - Предоставление доступа к данным через геттеры
* - Кэширование загруженных данных для оптимизации производительности
*/

import { defineStore } from 'pinia';
import { useUserAuthStore } from '@/modules/account/state.user.auth';
import axios from 'axios';

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    // Активная секция в модуле каталога
    activeSection: 'catalog',
    // Флаг загрузки данных
    isLoading: false,
    // Состояние ошибки
    error: null,
    // Список загруженных сервисов
    services: [],
    // Флаг, указывающий были ли загружены сервисы
    servicesLoaded: false,
    // Кэш деталей сервисов
    serviceDetails: {},
    // Флаг загрузки деталей
    loadingDetails: false,
    // Ошибка загрузки деталей
    detailsError: null
  }),

  getters: {
    // Получение активной секции
    getCurrentSection: (state) => state.activeSection,
    // Проверка загрузки
    getLoadingState: (state) => state.isLoading,
    // Получение ошибки
    getError: (state) => state.error,
    // Получение списка сервисов
    getServices: (state) => state.services,
    // Получение деталей сервиса по ID
    getServiceDetailsById: (state) => (id) => state.serviceDetails[id]
  },

  actions: {
    // Установка активной секции
    setActiveSection(section) {
      this.activeSection = section;
    },

    // Установка состояния загрузки
    setLoading(status) {
      this.isLoading = status;
    },

    // Установка ошибки
    setError(error) {
      this.error = error;
    },

    // Сброс ошибки
    clearError() {
      this.error = null;
    },

    // Загрузка списка сервисов
    async loadServices() {
      console.log('CatalogStore: Starting loadServices()');
      if (this.servicesLoaded) {
        console.log('CatalogStore: Services already loaded, skipping request');
        return;
      }

      this.setLoading(true);
      this.clearError();
      console.log('CatalogStore: Fetching services from API...');

      try {
        const userStore = useUserAuthStore();
        
        // Проверяем статус авторизации пользователя
        if (!userStore.isAuthenticated) {
          console.log('CatalogStore: User is not logged in');
          this.setError('Failed to load services. Please log in to access catalog.');
          return;
        }

        console.log('CatalogStore: Using JWT:', userStore.jwt ? 'Present' : 'Missing');
        
        const response = await axios.get('http://localhost:3000/api/catalog/services', {
          headers: { 
            Authorization: `Bearer ${userStore.jwt}` 
          }
        });
        console.log('CatalogStore: API response received:', response.data);

        this.services = response.data.services;
        this.servicesLoaded = true;
        console.log('CatalogStore: Services loaded successfully:', this.services.length, 'services');
      } catch (error) {
        console.error('CatalogStore: Error loading services:', error.response?.data || error.message);
        this.setError('Failed to load services');
        this.services = [];
      } finally {
        this.setLoading(false);
        console.log('CatalogStore: Loading state finished');
      }
    },

    // Загрузка деталей сервиса
    async loadServiceDetails(serviceId) {
      console.log('CatalogStore: Loading details for service:', serviceId);
      
      // Если детали уже загружены, возвращаем их из кэша
      if (this.serviceDetails[serviceId]) {
        console.log('CatalogStore: Details found in cache');
        return this.serviceDetails[serviceId];
      }

      this.loadingDetails = true;
      this.detailsError = null;

      try {
        const userStore = useUserAuthStore();
        
        if (!userStore.isAuthenticated) {
          throw new Error('User not logged in');
        }

        const response = await axios.get(`http://localhost:3000/api/catalog/services/${serviceId}/details`, {
          headers: { 
            Authorization: `Bearer ${userStore.jwt}` 
          }
        });

        console.log('CatalogStore: Details loaded successfully');
        this.serviceDetails[serviceId] = response.data.details;
        return response.data.details;
      } catch (error) {
        console.error('CatalogStore: Error loading service details:', error);
        this.detailsError = 'Failed to load service details';
        throw error;
      } finally {
        this.loadingDetails = false;
      }
    },

    // Сброс списка сервисов
    resetServices() {
      this.services = [];
      this.servicesLoaded = false;
      this.serviceDetails = {};
    }
  }
});