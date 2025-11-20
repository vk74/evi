/**
 * version: 1.0.0
 * Frontend service to fetch active services with their publication status across all catalog sections
 * File type: frontend TypeScript (service.admin.catalog.fetch-services-sections.ts)
 * Purpose: GET /api/admin/catalog/fetchpublishingservices - returns all active services with sections where published
 */

import { api } from '@/core/api/service.axios'

export interface ServiceSection {
  id: string
  name: string
  status: string
}

export interface ServiceWithSections {
  id: string
  serviceId: string
  serviceName: string
  serviceStatus: string
  sections: ServiceSection[]
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

export interface FetchServicesSectionsResponse {
  success: boolean
  message: string
  data: {
    services: ServiceWithSections[]
    sections: CatalogSection[]
  }
}

export const fetchServicesSections = async (): Promise<{ services: ServiceWithSections[]; sections: CatalogSection[] }> => {
  const response = await api.get<FetchServicesSectionsResponse>('/api/admin/catalog/fetchpublishingservices')
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch services and sections')
  }
  return response.data.data
}

export default fetchServicesSections

