/**
 * service.update.productRegions.ts - version 1.0.0
 * Frontend service for updating product regions data.
 * 
 * Handles API calls to backend for updating product regions functionality.
 * 
 * Frontend file - service.update.productRegions.ts
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import type { UpdateProductRegionsRequest, UpdateProductRegionsResponse } from './types.products.admin'

/**
 * Updates product regions data (full update)
 * @param productId - Product ID
 * @param regions - Array of regions with category assignments
 * @returns Promise<number> Total number of records updated
 */
export async function updateProductRegions(
  productId: string,
  regions: Array<{ region_id: number; category_id: number | null }>
): Promise<number> {
  const uiStore = useUiStore()
  
  try {
    const request: UpdateProductRegionsRequest = { regions }
    
    const response = await api.put<UpdateProductRegionsResponse>(
      `/api/admin/products/${productId}/regions`,
      request
    )
    
    if (response.data.success) {
      const totalRecords = response.data.data?.totalRecords || 0
      uiStore.showSuccessSnackbar(`Регионы продукта успешно обновлены (${totalRecords} записей)`)
      return totalRecords
    } else {
      throw new Error(response.data.message || 'Failed to update product regions')
    }
  } catch (error) {
    console.error('Error updating product regions:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to update product regions'
    uiStore.showErrorSnackbar(`Ошибка обновления регионов продукта: ${errorMessage}`)
    throw new Error(errorMessage)
  }
}

export default { updateProductRegions }

