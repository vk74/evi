/**
 * Version: 1.0.0
 * Service for fetching currencies for pricing admin module.
 * Frontend file that calls backend endpoint and returns Currency[] data.
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

export async function fetchCurrenciesService(): Promise<Currency[]> {
  const response = await api.get<FetchCurrenciesResponse>('/api/admin/pricing/fetch-currencies')
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to fetch currencies')
  }
  return response.data.data.currencies
}


