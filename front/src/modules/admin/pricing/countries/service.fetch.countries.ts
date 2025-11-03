/**
 * Version: 1.0.0
 * Service for fetching countries list for pricing admin module.
 * Frontend file that calls backend endpoint and returns string[] array of country codes.
 * Filename: service.fetch.countries.ts (frontend)
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
export async function fetchCountriesService(): Promise<string[]> {
  const response = await api.get<FetchCountriesResponse>(
    '/api/admin/pricing/countries'
  )
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch countries')
  }
  return response.data.data.countries
}

