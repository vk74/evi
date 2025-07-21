/**
 * @file service.refresh.tokens.ts
 * Version: 1.2.0
 * Service for refreshing authentication tokens.
 * Frontend file that handles token refresh requests and updates user session.
 * Updated to support device fingerprinting for enhanced security.
 */

import { api } from '@/core/api/service.axios'
import { useUserAuthStore } from './state.user.auth'
import type { RefreshTokenRequest, RefreshTokenResponse } from './types.auth'
import { STORAGE_KEYS } from './types.auth'
import { generateDeviceFingerprint } from './utils.device.fingerprint'

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
 * Now works with device fingerprinting - device fingerprint is sent with each request
 */
export async function refreshTokensService(): Promise<boolean> {
  console.log('[Refresh Service] Processing token refresh request')
  
  try {
    // Generate device fingerprint
    console.log('[Refresh Service] Generating device fingerprint...')
    const deviceFingerprint = generateDeviceFingerprint()
    
    // Send request with device fingerprint - refresh token will be sent automatically as cookie
    const response = await api.post<RefreshTokenResponse>(REFRESH_ENDPOINT, {
      deviceFingerprint
    } as RefreshTokenRequest)
    
    console.log('[Refresh Service] Refresh response received:', response.data)
    
    if (response.data.success) {
      // Store only access token (refresh token is now in httpOnly cookie)
      storeAccessToken(response.data.accessToken)
      
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