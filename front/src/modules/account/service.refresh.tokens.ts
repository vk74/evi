/**
 * @file service.refresh.tokens.ts
 * Version: 1.0.0
 * Service for refreshing authentication tokens.
 * Frontend file that handles token refresh requests and updates user session.
 */

import { api } from '@/core/api/service.axios'
import { useUserAuthStore } from './state.user.auth'
import type { RefreshRequest, RefreshResponse } from './types.auth'
import { STORAGE_KEYS } from './types.auth'

// API configuration
const REFRESH_ENDPOINT = '/api/auth/refresh'

/**
 * Stores access token in localStorage
 */
function storeAccessToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token)
  console.log('[Refresh Service] Access token stored in localStorage')
}

/**
 * Stores refresh token in localStorage
 */
function storeRefreshToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token)
  console.log('[Refresh Service] Refresh token stored in localStorage')
}

/**
 * Updates user store with token information
 */
function updateUserStore(accessToken: string): void {
  const userAuthStore = useUserAuthStore()
  userAuthStore.updateUserFromToken(accessToken)
  console.log('[Refresh Service] User store updated successfully')
}

/**
 * Handles different types of refresh errors
 */
function handleRefreshError(error: any): string {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status
    
    if (status === 401) {
      return 'сессия истекла, войдите заново'
    } else if (status >= 500) {
      return 'ошибка сервера при обновлении токена'
    } else {
      return 'ошибка обновления токена'
    }
  } else if (error.request) {
    // Network error - no response received
    return 'ошибка сети при обновлении токена'
  } else {
    // Other errors
    return 'неизвестная ошибка при обновлении токена'
  }
}

/**
 * Main refresh tokens service function
 */
export async function refreshTokensService(): Promise<boolean> {
  console.log('[Refresh Service] Processing token refresh request')
  
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  
  if (!refreshToken) {
    console.log('[Refresh Service] No refresh token found')
    return false
  }
  
  try {
    const response = await api.post<RefreshResponse>(REFRESH_ENDPOINT, {
      refreshToken
    })
    
    console.log('[Refresh Service] Refresh response received:', response.data)
    
    if (response.data.success) {
      // Store new tokens
      storeAccessToken(response.data.accessToken)
      storeRefreshToken(response.data.refreshToken)
      
      // Update user store
      updateUserStore(response.data.accessToken)
      
      console.log('[Refresh Service] Tokens refreshed successfully')
      return true
    } else {
      console.error('[Refresh Service] Refresh response indicates failure')
      return false
    }
  } catch (error) {
    console.error('[Refresh Service] Token refresh failed:', error)
    
    const errorMessage = handleRefreshError(error)
    console.log('[Refresh Service] Refresh error:', errorMessage)
    
    // For refresh errors, we don't show toast messages
    // as this is typically called automatically
    return false
  }
} 