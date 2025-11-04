/**
 * Version: 1.0.0
 * Helper for getting active price list IDs list from backend.
 * Frontend file that provides universal function to get array of active price list IDs.
 * Can be used across different modules that need active price list IDs.
 * Filename: get.active.pricelist.ids.ts (frontend)
 */

import { api } from '@/core/api/service.axios'

interface GetActivePriceListIdsResponse {
  success: boolean
  message?: string
  data?: { priceListIds: number[] }
  error?: string
}

/**
 * Get active price list IDs list from backend
 * @returns Promise with array of active price list IDs (e.g., [8, 10, 12])
 */
export async function getActivePriceListIds(): Promise<number[]> {
  const response = await api.get<GetActivePriceListIdsResponse>(
    '/api/core/pricelists/active/ids'
  )
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || 'Failed to get active price list IDs')
  }
  return response.data.data.priceListIds
}

