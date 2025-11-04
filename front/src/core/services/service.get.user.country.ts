/**
 * Version: 1.0.0
 * Service for getting user country from backend.
 * Frontend file that provides universal function to get user's country location.
 * Filename: service.get.user.country.ts (frontend)
 */

import { api } from '@/core/api/service.axios'

interface GetUserCountryResponse {
  success?: boolean
  message?: string
  country?: string | null
  error?: string
}

/**
 * Get user country from backend
 * @returns Promise with country value (string | null)
 */
export async function getUserCountry(): Promise<string | null> {
  const response = await api.get<GetUserCountryResponse>(
    '/api/admin/users/country'
  )
  
  if (response.data.error) {
    throw new Error(response.data.error || 'Failed to get user country')
  }
  
  return response.data.country || null
}