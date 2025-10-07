/**
 * File: service.create.product.option.pairs.ts
 * Version: 1.0.0
 * Description: Frontend service to create product-option pairs for Pair Editor modal.
 * Purpose: Sends create request, handles errors, and returns response.
 * Frontend file - service.create.product.option.pairs.ts
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import type { CreatePairsRequest, CreatePairsResponse } from './types.pair.editor'

export async function createProductOptionPairs(reqBody: CreatePairsRequest): Promise<CreatePairsResponse> {
  const uiStore = useUiStore()
  try {
    const { data } = await api.post<CreatePairsResponse>('/api/admin/products/create-product-option-pairs', reqBody)
    if (!data || data.success !== true) {
      throw new Error(data?.message || 'Failed to create product option pairs')
    }
    return data
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create pairs error'
    uiStore.showErrorSnackbar(message)
    throw error
  }
}

export default createProductOptionPairs


