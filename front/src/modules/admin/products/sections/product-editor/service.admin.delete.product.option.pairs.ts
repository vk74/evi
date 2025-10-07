/**
 * service.admin.delete.product.option.pairs.ts - version 1.0.0
 * Frontend service to delete product-option pairs (selected or all) for Products admin.
 * Frontend file - service.admin.delete.product.option.pairs.ts
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'

export interface DeletePairsRequest {
  mainProductId: string
  all: boolean
  selectedOptionIds?: string[]
}

export interface DeletePairsResponse {
  success: boolean
  mode: 'all'|'selected'
  totalRequested: number
  totalDeleted: number
  deletedOptionIds: string[]
  missingOptionIds?: string[]
}

export async function deleteProductOptionPairs(request: DeletePairsRequest): Promise<DeletePairsResponse> {
  const uiStore = useUiStore()
  try {
    const { data } = await api.post<DeletePairsResponse>('/api/admin/products/delete-product-option-pairs', request)
    if (!data || data.success !== true) {
      throw new Error('Failed to delete product option pairs')
    }
    return data
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete pairs error'
    uiStore.showErrorSnackbar(message)
    throw error
  }
}

export default deleteProductOptionPairs


