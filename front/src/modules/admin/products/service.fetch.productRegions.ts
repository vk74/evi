/**
 * service.fetch.productRegions.ts - version 1.0.0
 * Frontend service for fetching product regions data.
 * 
 * Handles API calls to backend for product regions functionality.
 * 
 * Frontend file - service.fetch.productRegions.ts
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import type { FetchProductRegionsResponse, ProductRegion } from './types.products.admin'

/**
 * Fetches product regions data for a specific product
 * @param productId - Product ID
 * @returns Promise<ProductRegion[]>
 */
export async function fetchProductRegions(productId: string): Promise<ProductRegion[]> {
  const uiStore = useUiStore()
  
  try {
    const response = await api.get<FetchProductRegionsResponse>(
      `/api/admin/products/${productId}/regions`
    )
    
    if (response.data.success && response.data.data) {
      return response.data.data
    } else {
      throw new Error(response.data.message || 'Failed to fetch product regions')
    }
  } catch (error) {
    console.error('Error fetching product regions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch product regions'
    uiStore.showErrorSnackbar(`Ошибка загрузки регионов продукта: ${errorMessage}`)
    throw new Error(errorMessage)
  }
}

export default { fetchProductRegions }

