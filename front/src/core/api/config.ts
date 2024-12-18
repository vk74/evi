// src/core/api/config.ts
import type { AxiosServiceConfig } from './types';

// Константы конфигурации
export const axiosSettings: AxiosServiceConfig = {
  baseURL: 'http://localhost:3000',
  timeout: 10000,
};