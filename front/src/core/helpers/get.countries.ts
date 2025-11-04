/**
 * Version: 1.2.0
 * Helper for getting countries list from backend.
 * Frontend file that provides universal function to get array of country codes.
 * Can be used across different modules that need countries list.
 * Filename: get.countries.ts (frontend)
 * 
 * Changes in v1.1.0:
 * - Updated endpoint from /api/admin/pricing/countries to /api/core/countries/list
 * - Now uses core endpoint instead of pricing module endpoint
 * 
 * Changes in v1.2.0:
 * - Renamed file from fetch.countries.ts to get.countries.ts
 * - Renamed function from fetchCountries() to getCountries()
 */

import { api } from '@/core/api/service.axios'

interface GetCountriesResponse {
  success: boolean
  message?: string
  data?: { countries: string[] }
  error?: string
}

/**
 * Get countries list from backend
 * @returns Promise with array of country codes (e.g., ['russia', 'kazakhstan'])
 */
export async function getCountries(): Promise<string[]> {
  const response = await api.get<GetCountriesResponse>(
    '/api/core/countries/list'
  )
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to get countries')
  }
  return response.data.data.countries
}

