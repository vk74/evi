/**
 * @file service.logout.ts
 * Version: 1.3.0
 * Service for user logout and session cleanup.
 * Frontend file that handles logout requests, clears tokens, and resets user session.
 * Updated to support device fingerprinting for enhanced security.
 */

import { api } from '@/core/api/service.axios'
import { useUserAuthStore } from '../auth/state.user.auth'
import { useUiStore } from '@/core/state/uistate'
import { useAppStore } from '@/core/state/appstate'
import { useProductsAdminStore } from '../../modules/admin/products/state.products.admin'
import { clearRefreshTimer } from './service.login'
import { refreshTokensService } from '../../modules/account/service.refresh.tokens'
import type { LogoutRequest, LogoutResponse } from './types.auth'
import { STORAGE_KEYS } from './types.auth'
import { generateDeviceFingerprint } from './helper.generate.device.fingerprint'

// API configuration
const LOGOUT_ENDPOINT = '/api/auth/logout'

/**
 * Clears all authentication tokens from localStorage
 */
function clearTokens(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    // Refresh token is now in httpOnly cookie - no need to clear from localStorage
    localStorage.removeItem('userToken') // Legacy token key
    console.log('[Logout Service] Access token cleared from localStorage')
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
 * Resets products admin store to initial state
 */
function resetProductsStore(): void {
  try {
    const productsStore = useProductsAdminStore()
    productsStore.resetState()
    console.log('[Logout Service] Products admin store reset to initial state')
  } catch (error) {
    console.error('[Logout Service] Error resetting products store:', error)
  }
}

/**
 * Sends logout request to backend with device fingerprint
 * Refresh token is automatically sent as httpOnly cookie
 */
async function sendLogoutRequest(): Promise<void> {
  try {
    console.log('[Logout Service] Sending logout request to backend...')
    
    // Generate device fingerprint
    console.log('[Logout Service] Generating device fingerprint...')
    const deviceFingerprint = generateDeviceFingerprint()
    
    // Send request with device fingerprint - refresh token will be sent automatically as cookie
    const response = await api.post<LogoutResponse>(LOGOUT_ENDPOINT, {
      deviceFingerprint
    } as LogoutRequest)
    
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
    
    // Send logout request to backend with device fingerprint (refresh token sent automatically as cookie)
    await sendLogoutRequest()
    
    // Clear local tokens
    clearTokens()
    
    // Reset user store
    resetUserStore()
    
    // Reset products admin store
    resetProductsStore()
    
    // Clear UI settings cache
    const { useAppSettingsStore } = await import('../../modules/admin/settings/state.app.settings')
    const appSettingsStore = useAppSettingsStore()
    appSettingsStore.clearUiSettingsCache()
    console.log('[Logout Service] UI settings cache cleared')
    
    // Reload public UI settings for anonymous user
    try {
      await appSettingsStore.loadUiSettings()
      console.log('[Logout Service] Public UI settings reloaded')
    } catch (error) {
      console.warn('[Logout Service] Failed to reload public UI settings:', error)
      // Continue with logout even if settings reload fails
    }
    
    // Set active module to login
    const appStore = useAppStore()
    appStore.setActiveModule('Login')
    console.log('[Logout Service] Redirected to login module')
    
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
    resetProductsStore()
    clearRefreshTimer()
    
    // Clear UI settings cache and reload public settings
    try {
      const { useAppSettingsStore } = await import('../../modules/admin/settings/state.app.settings')
      const appSettingsStore = useAppSettingsStore()
      appSettingsStore.clearUiSettingsCache()
      await appSettingsStore.loadUiSettings()
    } catch (settingsError) {
      console.warn('[Logout Service] Failed to clear/reload settings:', settingsError)
    }
    
    // Still redirect to login even on error
    const appStore = useAppStore()
    appStore.setActiveModule('Login')
    console.log('[Logout Service] Redirected to login module after error')
    
    return false
  }
} 