/**
 * @file service.axios.ts
 * Version: 1.2.0
 * Service for handling HTTP requests with axios and automatic token refresh.
 * Frontend file that creates configured axios instance with request/response interceptors,
 * manages authentication headers, handles network errors, and implements reactive token refresh
 * on 401 errors to maintain seamless user experience.
 *
 * Changes in v1.2.0:
 * - Request interceptor now checks userStore.isAuthenticated (instead of just jwt) before attaching token
 * - Prevents "zombie sessions" where backend accepts requests from users who are technically logged out
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { axiosSettings } from './config';
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import { useUiStore } from '@/core/state/uistate';
import { refreshTokensService } from '@/modules/account/service.refresh.tokens';

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
// Queue for requests that need to be retried after refresh
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

/**
 * Process queued requests after successful token refresh
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

/**
 * Creates and configures axios instance with interceptors
 */
const createAxiosInstance = (): AxiosInstance => {
  console.log('Creating axios instance with settings:', axiosSettings);
  
  const instance = axios.create({
    baseURL: axiosSettings.baseURL,
    timeout: axiosSettings.timeout,
    withCredentials: true // Enable sending cookies with requests
  });

  // Add authentication token to requests
  instance.interceptors.request.use((config) => {
    const userStore = useUserAuthStore();
    
    // Only send token if user is officially authenticated (loggedIn + jwt)
    // This prevents sending tokens when app considers user logged out
    if (userStore.isAuthenticated) {
      config.headers.Authorization = `Bearer ${userStore.jwt}`;
      console.log('Request prepared:', config.url);
    }
    
    return config;
  }, (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  });

  // Handle responses and errors with automatic token refresh
  instance.interceptors.response.use((response) => {
    return response;
  }, async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Treat canceled requests distinctly to avoid false "server not responding" errors
    if ((axios as any).isCancel?.(error) || (error as any).code === 'ERR_CANCELED' || (error as any).name === 'CanceledError') {
      return Promise.reject(error);
    }

    if (!error.response) {
      console.error('Network error: Server is not responding');
      return Promise.reject(new Error('Сервер не отвечает'));
    }

    // Handle 401 Unauthorized with automatic token refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      const userStore = useUserAuthStore();
      
      // Security check: Don't attempt refresh if user is not officially logged in
      // This prevents "zombie sessions" from auto-refreshing when the app thinks user is logged out
      if (!userStore.isAuthenticated) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          // Retry the original request with new token
          const userStore = useUserAuthStore();
          if (userStore.isAuthenticated) {
            originalRequest.headers!.Authorization = `Bearer ${userStore.jwt}`;
          }
          return instance(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('Attempting automatic token refresh due to 401 error');
        const refreshSuccess = await refreshTokensService();
        
        if (refreshSuccess) {
          console.log('Token refresh successful, retrying original request');
          processQueue(null, null);
          
          // Retry the original request with new token
          const userStore = useUserAuthStore();
          if (userStore.isAuthenticated) {
            originalRequest.headers!.Authorization = `Bearer ${userStore.jwt}`;
          }
          return instance(originalRequest);
        } else {
          console.log('Token refresh failed, redirecting to login');
          processQueue(new Error('Token refresh failed'), null);
          
          // Show error message to user
          const uiStore = useUiStore();
          uiStore.showErrorSnackbar('ошибка обновления сессии, необходима повторная авторизация');
          
          // Redirect to login page
          window.location.href = '/login';
          return Promise.reject(new Error('Необходима повторная авторизация'));
        }
      } catch (refreshError) {
        console.error('Token refresh error:', refreshError);
        processQueue(refreshError, null);
        
        // Show error message to user
        const uiStore = useUiStore();
        uiStore.showErrorSnackbar('ошибка обновления сессии, необходима повторная авторизация');
        
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(new Error('Необходима повторная авторизация'));
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other HTTP errors
    switch (error.response.status) {
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

// Export configured axios instance
export const api = createAxiosInstance();