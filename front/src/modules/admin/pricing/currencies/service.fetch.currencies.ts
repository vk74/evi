/**
 * Version: 1.0.1
 * Service for fetching currencies for pricing admin module.
 * Frontend file that calls backend endpoint and returns Currency[] data.
 * Supports optional filtering of active currencies only.
 * Filename: service.fetch.currencies.ts (frontend)
 */

import { api } from '@/core/api/service.axios'
import type { Currency } from '../types.pricing.admin'

interface FetchCurrenciesResponse {
  success: boolean
  message?: string
  data?: { currencies: Currency[] }
  error?: string
}

/**
 * Fetch currencies from backend
 * @param activeOnly - If true, fetches only active currencies; otherwise fetches all currencies
 */
export async function fetchCurrenciesService(activeOnly: boolean = false): Promise<Currency[]> {
  const queryParam = activeOnly ? '?activeOnly=true' : ''
  const response = await api.get<FetchCurrenciesResponse>(
    `/api/admin/pricing/fetch-currencies${queryParam}`
  )
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch currencies')
  }
  return response.data.data.currencies
}


