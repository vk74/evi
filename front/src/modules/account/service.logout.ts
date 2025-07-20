/**
 * @file service.logout.ts
 * Version: 1.1.0
 * Service for user logout and session cleanup.
 * Frontend file that handles logout requests, clears tokens, and resets user session.
 */

import { api } from '@/core/api/service.axios'
import { useUserAuthStore } from './state.user.auth'
import { useUiStore } from '@/core/state/uistate'
import { clearRefreshTimer } from './service.login'
import { refreshTokensService } from './service.refresh.tokens'
import type { LogoutRequest, LogoutResponse } from './types.auth'
import { STORAGE_KEYS } from './types.auth'

// API configuration
const LOGOUT_ENDPOINT = '/api/auth/logout'

/**
 * Clears all authentication tokens from localStorage
 */
function clearTokens(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem('userToken') // Legacy token key
    console.log('[Logout Service] All tokens cleared from localStorage')
  } catch (error) {
    console.error('[Logout Service] Error clearing tokens from localStorage:', error)
  }
}

/**
 * Resets user store to initial state
 */
function resetUserStore(): void {
  try {
    const userAuthStore = useUserAuthStore()
    userAuthStore.clearUser()
    console.log('[Logout Service] User store reset to initial state')
  } catch (error) {
    console.error('[Logout Service] Error resetting user store:', error)
  }
}

/**
 * Sends logout request to backend
 */
async function sendLogoutRequest(): Promise<void> {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  
  if (!refreshToken) {
    console.log('[Logout Service] No refresh token found, skipping backend logout')
    return
  }
  
  try {
    console.log('[Logout Service] Sending logout request to backend...')
    const response = await api.post<LogoutResponse>(LOGOUT_ENDPOINT, {
      refreshToken
    })
    
    console.log('[Logout Service] Backend logout response:', response.data)
    
    if (response.data.success) {
      console.log('[Logout Service] Backend logout successful')
    } else {
      console.warn('[Logout Service] Backend logout returned false success')
    }
  } catch (error) {
    console.error('[Logout Service] Backend logout error:', error)
    // Don't throw error for logout - we want to clear local state anyway
  }
}

/**
 * Handles different types of logout errors
 */
function handleLogoutError(error: any): string {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status
    
    if (status >= 500) {
      return 'ошибка сервера при выходе из системы'
    } else if (status === 401) {
      return 'сессия уже завершена'
    } else {
      return 'ошибка при выходе из системы'
    }
  } else if (error.request) {
    // Network error - no response received
    return 'ошибка сети при выходе из системы'
  } else {
    // Other errors
    return 'неизвестная ошибка при выходе из системы'
  }
}

/**
 * Main logout service function
 */
export async function logoutService(): Promise<boolean> {
  console.log('[Logout Service] Processing logout request')
  
  try {
    // Clear refresh timer first
    clearRefreshTimer()
    console.log('[Logout Service] Refresh timer cleared')
    
    // Send logout request to backend
    await sendLogoutRequest()
    
    // Clear local tokens
    clearTokens()
    
    // Reset user store
    resetUserStore()
    
    console.log('[Logout Service] Logout completed successfully')
    return true
    
  } catch (error) {
    console.error('[Logout Service] Logout error:', error)
    
    const errorMessage = handleLogoutError(error)
    const uiStore = useUiStore()
    uiStore.showErrorSnackbar(errorMessage)
    
    // Even if backend logout fails, clear local state
    clearTokens()
    resetUserStore()
    clearRefreshTimer()
    
    return false
  }
} 