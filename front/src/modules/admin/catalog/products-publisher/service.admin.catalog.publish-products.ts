/**
 * version: 1.0.0
 * Frontend service to publish products to catalog sections
 * File type: frontend TypeScript (service.admin.catalog.publish-products.ts)
 * Purpose: POST /api/admin/catalog/product-publish
 */

import { api } from '@/core/api/service.axios'

export interface PublishProductsRequest {
  product_ids: string[]
  section_ids: string[]
}

export interface PublishProductsResponse {
  success: boolean
  message: string
  addedCount: number
  updatedCount: number
}

export const publishProducts = async (productIds: string[], sectionIds: string[]): Promise<PublishProductsResponse> => {
  const response = await api.post<PublishProductsResponse>('/api/admin/catalog/product-publish', {
    product_ids: productIds,
    section_ids: sectionIds
  })
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to publish products')
  }
  return response.data
}

export default publishProducts

