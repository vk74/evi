/**
 * Version: 1.0.0
 * Service for getting user location from backend.
 * Frontend file that provides universal function to get user's location.
 * Filename: service.get.user.location.ts (frontend)
 */

import { api } from '@/core/api/service.axios'

interface GetUserLocationResponse {
  success?: boolean
  message?: string
  location?: string | null
  error?: string
}

/**
 * Get user location from backend
 * @returns Promise with location value (string | null)
 */
export async function getUserLocation(): Promise<string | null> {
  const response = await api.get<GetUserLocationResponse>(
    '/api/admin/users/location'
  )
  
  if (response.data.error) {
    throw new Error(response.data.error || 'Failed to get user location')
  }
  
  return response.data.location || null
}

