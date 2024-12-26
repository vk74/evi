/**
 * @file service.axios.ts
 * Service for handling HTTP requests with axios.
 *
 * Functionality:
 * - Creates and configures axios instance
 * - Manages authentication headers
 * - Handles network-level errors
 * - Provides request/response interceptors
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { axiosSettings } from './config';
import { useUserStore } from '@/core/state/userstate';

/**
 * Создаем и настраиваем axios инстанс
 */
const createAxiosInstance = (): AxiosInstance => {
  console.log('Creating axios instance with settings:', axiosSettings);
  
  const instance = axios.create({
    baseURL: axiosSettings.baseURL,
    timeout: axiosSettings.timeout
  });

  // Добавляем токен авторизации к запросам
  instance.interceptors.request.use((config) => {
    const userStore = useUserStore();
    
    if (userStore.jwt) {
      config.headers.Authorization = `Bearer ${userStore.jwt}`;
      console.log('Request prepared:', config.url);
    }
    
    return config;
  }, (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  });

  // Обработка ответов и ошибок
  instance.interceptors.response.use((response) => {
    return response;
  }, (error: AxiosError) => {
    if (!error.response) {
      console.error('Network error: Server is not responding');
      return Promise.reject(new Error('Сервер не отвечает'));
    }

    switch (error.response.status) {
      case 401:
        console.error('Authentication error: Invalid or expired token');
        return Promise.reject(new Error('Необходима повторная авторизация'));
      case 403:
        console.error('Authorization error: Access forbidden');
        return Promise.reject(new Error('Нет прав доступа'));
      case 404:
        console.error('Resource not found:', error.config?.url);
        return Promise.reject(new Error('Ресурс не найден'));
      default:
        console.error('Request failed:', error.response.status, error.config?.url);
        return Promise.reject(error);
    }
  });

  return instance;
};

// Экспортируем готовый инстанс
export const api = createAxiosInstance();