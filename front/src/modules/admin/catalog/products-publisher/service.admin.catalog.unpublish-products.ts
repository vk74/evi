/**
 * version: 1.0.0
 * Frontend service to unpublish products from catalog sections
 * File type: frontend TypeScript (service.admin.catalog.unpublish-products.ts)
 * Purpose: POST /api/admin/catalog/product-unpublish
 */

import { api } from '@/core/api/service.axios'

export interface UnpublishProductsRequest {
  product_ids: string[]
  section_ids: string[]
}

export interface UnpublishProductsResponse {
  success: boolean
  message: string
  removedCount: number
}

export const unpublishProducts = async (productIds: string[], sectionIds: string[]): Promise<UnpublishProductsResponse> => {
  const response = await api.post<UnpublishProductsResponse>('/api/admin/catalog/product-unpublish', {
    product_ids: productIds,
    section_ids: sectionIds
  })
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to unpublish products')
  }
  return response.data
}

export default unpublishProducts

