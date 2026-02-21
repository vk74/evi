/**
 * version: 1.1.0
 * purpose: API URL configuration and axios defaults.
 * file: FRONTEND file: config.ts
 * logic: Reads VITE_API_URL from Vite environment variables, falls back to localhost.
 *
 * Changes in v1.1.0:
 * - Migrated from process.env.VUE_APP_API_URL to import.meta.env.VITE_API_URL (Vite migration)
 * - Removed dual Vue CLI / Vite compatibility check
 */

import type { AxiosServiceConfig } from './types';

// Get backend API URL from Vite environment variable or fallback to localhost
const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://localhost:7777';
};

export const axiosSettings: AxiosServiceConfig = {
  baseURL: getApiUrl(),
  timeout: 10000,
};