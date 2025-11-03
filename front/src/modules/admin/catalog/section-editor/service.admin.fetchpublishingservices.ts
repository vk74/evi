/**
 * version: 1.0.0
 * Frontend service to fetch publishing services for a catalog section
 * File type: frontend TypeScript (service.admin.fetchpublishingservices.ts)
 * Purpose: GET /api/admin/catalog/fetchpublishingservices with pagination/search/sort
 */

import { api } from '@/core/api/service.axios'

export interface PublishingServiceRow {
  id: string
  name: string
  owner?: string | null
  status?: string | null
  is_public: boolean
  selected?: boolean
  order?: number | null
}

export interface FetchPublishingServicesResponse {
  success: boolean
  message: string
  data: {
    items: PublishingServiceRow[]
    page: number
    perPage: number
    total: number
  }
}

export const fetchPublishingServices = async (params: {
  sectionId: string,
  page?: number,
  perPage?: number,
  search?: string,
  owner?: string,
  status?: string,
  is_public?: boolean,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
}): Promise<{ items: PublishingServiceRow[]; page: number; perPage: number; total: number }> => {
  const response = await api.get<FetchPublishingServicesResponse>('/api/admin/catalog/fetchpublishingservices', { params })
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch publishing services')
  }
  return response.data.data
}

export default fetchPublishingServices


