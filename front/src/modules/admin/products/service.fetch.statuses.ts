/**
 * @file service.fetch.statuses.ts
 * Version: 1.2.0
 * Frontend service for fetching product statuses from API.
 * Frontend file that handles product statuses fetching from API.
 * Always fetches fresh data from database - no caching.
 * 
 * Changes in v1.2.0:
 * - Removed all caching logic
 * - Always makes API request to fetch fresh data from database
 * - Statuses stored in pinia store only for filter dropdown (no cache validation)
 */

import { api } from '@/core/api/service.axios'
import { useProductsAdminStore } from './state.products.admin'
import type { ProductStatus } from './types.products.admin'

/**
 * Interface for API response
 */
interface FetchProductStatusesResponse {
  success: boolean
  message: string
  data?: {
    statuses: ProductStatus[]
  }
}

/**
 * Frontend service for fetching product statuses from API
 */
export class ServiceFetchStatuses {
  /**
   * Fetches product statuses from backend API.
   * Always fetches fresh data from database - no caching.
   * @returns Promise with statuses array or empty array on error
   */
  async fetchProductStatuses(): Promise<ProductStatus[]> {
    const store = useProductsAdminStore()
    const { useUiStore } = await import('@/core/state/uistate')
    const uiStore = useUiStore()

    try {
      // Always make API request to fetch fresh data from database
      const response = await api.get<FetchProductStatusesResponse>(
        '/api/admin/products/fetch-statuses'
      )

      // Check if request was successful
      if (response.data.success && response.data.data?.statuses) {
        // Update store with fresh statuses (for filter dropdown only)
        store.setProductStatuses(response.data.data.statuses)
        return response.data.data.statuses
      } else {
        uiStore.showErrorSnackbar(response.data.message || 'Failed to fetch product statuses')
        return []
      }
    } catch (error: any) {
      console.error('Error fetching product statuses:', error)
      uiStore.showErrorSnackbar(error.response?.data?.message || error.message || 'An unexpected error occurred while fetching product statuses.')
      return []
    }
  }
}

// Export singleton instance
export const serviceFetchStatuses = new ServiceFetchStatuses()
