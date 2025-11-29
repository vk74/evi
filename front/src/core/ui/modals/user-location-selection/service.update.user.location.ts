/**
 * Version: 1.0.0
 * Service for updating user location on backend.
 * Frontend file that provides function to update user's location.
 * Filename: service.update.user.location.ts (frontend)
 */

import { api } from '@/core/api/service.axios'

interface UpdateUserLocationRequest {
  location: string
}

interface UpdateUserLocationResponse {
  success?: boolean
  message?: string
  location?: string
  user_id?: string
  username?: string
  error?: string
}

/**
 * Update user location on backend
 * @param location - Region name to set as user location
 * @returns Promise with updated location data
 */
export async function updateUserLocation(location: string): Promise<UpdateUserLocationResponse> {
  const response = await api.post<UpdateUserLocationResponse>(
    '/api/admin/users/update-location',
    { location } as UpdateUserLocationRequest
  )
  
  if (response.data.error) {
    throw new Error(response.data.error || 'Failed to update user location')
  }
  
  return response.data
}

