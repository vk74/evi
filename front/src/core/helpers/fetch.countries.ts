/**
 * Version: 1.0.0
 * Helper for fetching countries list from backend.
 * Frontend file that provides universal function to get array of country codes.
 * Can be used across different modules that need countries list.
 * Filename: fetch.countries.ts (frontend)
 */

import { api } from '@/core/api/service.axios'

interface FetchCountriesResponse {
  success: boolean
  message?: string
  data?: { countries: string[] }
  error?: string
}

/**
 * Fetch countries list from backend
 * @returns Promise with array of country codes (e.g., ['russia', 'kazakhstan'])
 */
export async function fetchCountries(): Promise<string[]> {
  const response = await api.get<FetchCountriesResponse>(
    '/api/admin/pricing/countries'
  )
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch countries')
  }
  return response.data.data.countries
}

