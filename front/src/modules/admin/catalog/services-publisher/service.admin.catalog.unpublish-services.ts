/**
 * version: 1.0.0
 * Frontend service to unpublish services from catalog sections
 * File type: frontend TypeScript (service.admin.catalog.unpublish-services.ts)
 * Purpose: POST /api/admin/catalog/service-unpublish
 */

import { api } from '@/core/api/service.axios'

export interface UnpublishServicesRequest {
  service_ids: string[]
  section_ids: string[]
}

export interface UnpublishServicesResponse {
  success: boolean
  message: string
  removedCount: number
}

export const unpublishServices = async (serviceIds: string[], sectionIds: string[]): Promise<UnpublishServicesResponse> => {
  const response = await api.post<UnpublishServicesResponse>('/api/admin/catalog/service-unpublish', {
    service_ids: serviceIds,
    section_ids: sectionIds
  })
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to unpublish services')
  }
  return response.data
}

export default unpublishServices

