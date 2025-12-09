// src/core/api/config.ts
import type { AxiosServiceConfig } from './types';

// Константы конфигурации
// Use environment variable VUE_APP_API_URL if available, otherwise fallback to localhost
// In container, VITE_API_URL is set, but Vue CLI uses VUE_APP_ prefix
// So we check both VUE_APP_API_URL and VITE_API_URL for compatibility
const getApiUrl = (): string => {
  // Check for Vue CLI environment variable (VUE_APP_*)
  if (process.env.VUE_APP_API_URL) {
    return process.env.VUE_APP_API_URL;
  }
  // Check for Vite-style environment variable (for container compatibility)
  if (process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  // Fallback to localhost for local development
  return 'http://localhost:3000';
};

export const axiosSettings: AxiosServiceConfig = {
  baseURL: getApiUrl(),
  timeout: 10000,
};