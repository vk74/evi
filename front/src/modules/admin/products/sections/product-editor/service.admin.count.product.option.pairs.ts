/**
 * service.admin.count.product.option.pairs.ts - version 1.0.0
 * Frontend service to count product-option pairs for a product.
 * Frontend file - service.admin.count.product.option.pairs.ts
 */

import { api } from '@/core/api/service.axios'

export interface CountPairsRequest { mainProductId: string }
export interface CountPairsResponse { success: boolean; count: number }

export async function countProductOptionPairs(request: CountPairsRequest): Promise<number> {
  const { data } = await api.post<CountPairsResponse>('/api/admin/products/count-product-option-pairs', request)
  if (!data || data.success !== true) {
    throw new Error('Failed to count product option pairs')
  }
  return data.count
}

export default countProductOptionPairs


