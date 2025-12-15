/**
 * @file service.permissions.ts
 * Version: 1.0.0
 * Service for fetching user permissions.
 * Frontend file that retrieves the list of permissions for the current user from the backend.
 */

import { api } from '@/core/api/service.axios'
import { useUserAuthStore } from './state.user.auth'
import type { PermissionsResponse } from './types.auth'

// API configuration
const PERMISSIONS_ENDPOINT = '/api/auth/permissions'

/**
 * Fetches user permissions from the backend and updates the store
 * @returns Promise<boolean> true if successful, false otherwise
 */
export async function fetchPermissionsService(): Promise<boolean> {
  console.log('[Permission Service] Fetching user permissions...')
  
  try {
    const response = await api.get<PermissionsResponse>(PERMISSIONS_ENDPOINT)
    
    if (response.data && Array.isArray(response.data.permissions)) {
      const store = useUserAuthStore()
      store.setPermissions(response.data.permissions)
      console.log(`[Permission Service] Successfully loaded ${response.data.permissions.length} permissions`)
      return true
    } else {
      console.warn('[Permission Service] Invalid response format for permissions')
      return false
    }
  } catch (error) {
    console.error('[Permission Service] Error fetching permissions:', error)
    return false
  }
}

