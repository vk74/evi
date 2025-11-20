/**
 * version: 1.0.0
 * Frontend service to fetch active products with their publication status across all catalog sections
 * File type: frontend TypeScript (service.admin.catalog.fetch-products-sections.ts)
 * Purpose: GET /api/admin/catalog/fetchpublishingproducts - returns all active products with sections where published
 */

import { api } from '@/core/api/service.axios'

export interface ProductSection {
  id: string
  name: string
  status: string
}

export interface ProductWithSections {
  id: string
  productId: string
  productName: string
  productStatus: string
  sections: ProductSection[]
  published: boolean
  allSectionStatuses: string[]
}

export interface CatalogSection {
  id: string
  name: string
  owner: string | null
  backup_owner: string | null
  description: string | null
  comments: string | null
  status: string | null
  is_public: boolean
  order: number | null
  parent_id: string | null
  icon_name: string | null
  color: string | null
  created_at: string
  created_by: string
  modified_at: string | null
  modified_by: string | null
}

export interface FetchProductsSectionsResponse {
  success: boolean
  message: string
  data: {
    products: ProductWithSections[]
    sections: CatalogSection[]
  }
}

export const fetchProductsSections = async (): Promise<{ products: ProductWithSections[]; sections: CatalogSection[] }> => {
  const response = await api.get<FetchProductsSectionsResponse>('/api/admin/catalog/fetchpublishingproducts')
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch products and sections')
  }
  return response.data.data
}

export default fetchProductsSections

