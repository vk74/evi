/**
 * @file service.fetch.statuses.ts
 * Version: 1.0.0
 * Frontend service for fetching product statuses with caching.
 * Frontend file that handles product statuses fetching from API with cache management.
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
 * Frontend service for fetching product statuses with caching
 */
export class ServiceFetchStatuses {
  /**
   * Fetches product statuses from backend API with caching
   * Checks if statuses are fresh in store, returns cached if fresh, otherwise fetches from API
   * @returns Promise with statuses array or empty array on error
   */
  async fetchProductStatuses(): Promise<ProductStatus[]> {
    const store = useProductsAdminStore()

    // Check if statuses are fresh in store
    if (store.areStatusesFresh && store.statuses) {
      return store.statuses
    }

    try {
      // Make API request to fetch statuses
      const response = await api.get<FetchProductStatusesResponse>(
        '/api/admin/products/fetch-statuses'
      )

      // Check if request was successful
      if (response.data.success && response.data.data?.statuses) {
        // Update store with new statuses and timestamp
        store.setProductStatuses(response.data.data.statuses)
        return response.data.data.statuses
      } else {
        console.error('Failed to fetch product statuses:', response.data.message)
        return []
      }
    } catch (error: any) {
      console.error('Error fetching product statuses:', error)

      // Handle different error types
      if (error.response?.status === 401) {
        console.error('Authentication required. Please log in again.')
      } else if (error.response?.status === 403) {
        console.error('Access denied. You do not have permission to view product statuses.')
      } else if (error.response?.status >= 500) {
        console.error('Server error. Please try again later.')
      } else if (error.response?.data?.message) {
        console.error(error.response.data.message)
      } else if (error.message) {
        console.error(error.message)
      } else {
        console.error('An unexpected error occurred while fetching product statuses.')
      }

      // Return empty array on error
      return []
    }
  }
}

// Export singleton instance
export const serviceFetchStatuses = new ServiceFetchStatuses()
