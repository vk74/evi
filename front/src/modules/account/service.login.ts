/**
 * @file service.login.ts
 * Version: 1.2.0
 * Service for user authentication and token management.
 * Frontend file that handles login requests, processes tokens, and manages user session.
 */

import { api } from '@/core/api/service.axios'
import { useUserAuthStore } from './state.user.auth'
import { useUiStore } from '@/core/state/uistate'
import type { LoginRequest, LoginResponse } from './types.auth'
import { STORAGE_KEYS } from './types.auth'

// API configuration
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
 * Handles different types of login errors and returns error keys for i18n
 */
function handleLoginError(error: any): string {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status
    
    if (status >= 500) {
      return 'login.errors.serverError'
    } else if (status === 401) {
      return 'login.errors.invalidCredentials'
    } else if (status === 429) {
      return 'login.errors.tooManyAttempts'
    } else {
      return 'login.errors.unknownError'
    }
  } else if (error.request) {
    // Network error - no response received
    return 'login.errors.networkError'
  } else {
    // Other errors
    return 'login.errors.unknownError'
  }
}

/**
 * Main login service function
 * Sends POST request to /api/auth/login with username and password
 * Request payload: { username: string, password: string }
 * Returns: Promise<{ success: boolean, errorKey?: string }>
 */
export async function loginService(username: string, password: string): Promise<{ success: boolean, errorKey?: string }> {
  console.log('[Login Service] Processing login request for user:', username)
  
  try {
    const response = await api.post<LoginResponse>(LOGIN_ENDPOINT, {
      username,
      password
    } as LoginRequest)
    
    console.log('[Login Service] Login response received:', response.data)
    
    if (response.data.success) {
      // Store tokens
      storeAccessToken(response.data.accessToken)
      storeRefreshToken(response.data.refreshToken)
      
      // Update user store with token
      updateUserStore(response.data.accessToken)
      
      console.log('[Login Service] Login successful for user:', username)
      return { success: true }
    } else {
      return { success: false, errorKey: 'login.errors.invalidCredentials' }
    }
  } catch (error) {
    console.error('[Login Service] Login error:', error)
    
    const errorKey = handleLoginError(error)
    return { success: false, errorKey }
  }
}

/**
 * Clears refresh timer
 */
export function clearRefreshTimer(): void {
  const userAuthStore = useUserAuthStore()
  userAuthStore.clearRefreshTimer()
} 