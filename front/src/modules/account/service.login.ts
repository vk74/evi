/**
 * @file service.login.ts
 * Version: 1.0.0
 * Service for user authentication and token management.
 * Frontend file that handles login requests, processes tokens, and manages user session.
 */

import axios from 'axios'
import { useUserAuthStore } from './state.user.auth'
import { useUiStore } from '@/core/state/uistate'
import { refreshTokensService } from './service.refresh.tokens'
import type { LoginRequest, LoginResponse } from './types.auth'
import { STORAGE_KEYS } from './types.auth'

// API configuration
const API_BASE_URL = 'http://localhost:3000'
const LOGIN_ENDPOINT = '/api/auth/login'

/**
 * Stores access token in localStorage
 */
function storeAccessToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
  console.log('[Login Service] Access token stored in localStorage')
}

/**
 * Stores refresh token in localStorage
 */
function storeRefreshToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token)
  console.log('[Login Service] Refresh token stored in localStorage')
}

/**
 * Updates user store with token information
 */
function updateUserStore(accessToken: string): void {
  const userAuthStore = useUserAuthStore()
  userAuthStore.setUserFromToken(accessToken)
  console.log('[Login Service] User store updated successfully')
}

/**
 * Handles different types of login errors
 */
function handleLoginError(error: any): string {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status
    
    if (status >= 500) {
      return 'сервер временно недоступен, попробуйте позже'
    } else if (status === 401) {
      return 'неверное имя пользователя или пароль'
    } else if (status === 429) {
      return 'слишком много попыток входа, попробуйте через 15 минут'
    } else {
      return 'ошибка аутентификации'
    }
  } else if (error.request) {
    // Network error - no response received
    return 'ошибка сети, проверьте подключение к интернету'
  } else {
    // Other errors
    return 'неизвестная ошибка при входе в систему'
  }
}

/**
 * Main login service function
 */
export async function loginService(username: string, password: string): Promise<boolean> {
  console.log('[Login Service] Processing login request for user:', username)
  
  try {
    const response = await axios.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
      username,
      password
    })
    
    console.log('[Login Service] Login response received:', response.data)
    
    if (response.data.success) {
      // Store tokens
      storeAccessToken(response.data.accessToken)
      storeRefreshToken(response.data.refreshToken)
      
      // Update user store with token
      updateUserStore(response.data.accessToken)
      
      console.log('[Login Service] Login successful for user:', username)
      return true
    } else {
      throw new Error('неверное имя пользователя или пароль')
    }
  } catch (error) {
    console.error('[Login Service] Login error:', error)
    
    const errorMessage = handleLoginError(error)
    const uiStore = useUiStore()
    uiStore.showErrorSnackbar(errorMessage)
    
    return false
  }
}

/**
 * Clears refresh timer
 */
export function clearRefreshTimer(): void {
  const userAuthStore = useUserAuthStore()
  userAuthStore.clearRefreshTimer()
} 