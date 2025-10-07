/**
 * File: service.update.product.option.pairs.ts
 * Version: 1.0.0
 * Description: Frontend service to update product-option pairs for Pair Editor modal.
 * Purpose: Sends update request, handles errors, and returns response.
 * Frontend file - service.update.product.option.pairs.ts
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import type { UpdatePairsRequest, UpdatePairsResponse } from './types.pair.editor'

export async function updateProductOptionPairs(reqBody: UpdatePairsRequest): Promise<UpdatePairsResponse> {
  const uiStore = useUiStore()
  try {
    const { data } = await api.post<UpdatePairsResponse>('/api/admin/products/update-product-option-pairs', reqBody)
    if (!data || data.success !== true) {
      throw new Error(data?.message || 'Failed to update product option pairs')
    }
    return data
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Update pairs error'
    uiStore.showErrorSnackbar(message)
    throw error
  }
}

export default updateProductOptionPairs


