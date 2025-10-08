/**
 * File: service.read.product.option.pairs.ts
 * Version: 1.0.0
 * Description: Frontend service to read existing product-option pairs for the Pair Editor modal.
 * Purpose: Fetches existing pair records by main product id and selected option ids to prefill the UI.
 * Frontend file - service.read.product.option.pairs.ts
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import type { ReadPairsRequest, ReadPairsResponse, PairRecord } from './types.pair.editor'

/**
 * Reads existing product-option pairs for the given main product and option list.
 * @param params - Request containing mainProductId and optionProductIds
 * @returns Array of PairRecord for the found pairs (subset of option ids)
 */
export async function readProductOptionPairs(params: ReadPairsRequest): Promise<PairRecord[]> {
  const uiStore = useUiStore()

  if (!params || !params.mainProductId || !Array.isArray(params.optionProductIds)) {
    uiStore.showErrorSnackbar('Invalid parameters for reading product option pairs')
    return []
  }

  try {
    const response = await api.post<ReadPairsResponse>('/api/admin/products/read-product-option-pairs', params)
    if (response.data && response.data.success && Array.isArray(response.data.pairs)) {
      return response.data.pairs
    }
    uiStore.showErrorSnackbar(response.data?.message || 'Failed to read product option pairs')
    return []
  } catch (error) {
    uiStore.showErrorSnackbar('Error reading product option pairs')
    return []
  }
}

export async function fetchPairedOptionIds(mainProductId: string): Promise<string[]> {
  const response = await api.post<ReadPairsResponse>('/api/admin/products/read-product-option-pairs', { mainProductId, mode: 'ids' })
  if (response.data && response.data.success && Array.isArray(response.data.optionProductIds)) {
    return response.data.optionProductIds
  }
  return []
}

export async function fetchExistsMap(mainProductId: string, optionProductIds: string[]): Promise<Record<string, boolean>> {
  const response = await api.post<ReadPairsResponse>('/api/admin/products/read-product-option-pairs', { mainProductId, optionProductIds, mode: 'exists' })
  if (response.data && response.data.success && response.data.existsMap) {
    return response.data.existsMap
  }
  return {}
}

export default readProductOptionPairs


