/**
 * Version: 1.0.0
 * Service for getting pricelist by region from backend.
 * Frontend file that provides function to get pricelist ID by region.
 * Filename: service.catalog.get.pricelist.by.region.ts (frontend)
 */

import { api } from '@/core/api/service.axios'

interface GetPricelistByRegionResponse {
  success?: boolean
  message?: string
  data?: {
    price_list_id: number
    name: string
    currency_code: string
    currency_symbol: string | null
    rounding_precision: number | null
  }
  error?: string
}

/**
 * Get pricelist ID by region from backend
 * @param region - Region value (string)
 * @returns Promise with pricelist ID (number) or null if not found
 */
export async function getPricelistByRegion(region: string): Promise<number | null> {
  if (!region || typeof region !== 'string' || region.trim().length === 0) {
    console.error('[getPricelistByRegion] Invalid region:', region)
    return null
  }

  try {
    const response = await api.get<GetPricelistByRegionResponse>(
      `/api/catalog/pricelist-by-region/${encodeURIComponent(region.trim())}`
    )
    
    if (response.data.error || !response.data.success || !response.data.data) {
      console.warn('[getPricelistByRegion] No pricelist found for region:', region)
      return null
    }
    
    return response.data.data.price_list_id
  } catch (error) {
    console.error('[getPricelistByRegion] Error fetching pricelist by region:', error)
    return null
  }
}

