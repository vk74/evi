/**
 * version: 1.0.0
 * Frontend service to publish services to catalog sections
 * File type: frontend TypeScript (service.admin.catalog.publish-services.ts)
 * Purpose: POST /api/admin/catalog/service-publish
 */

import { api } from '@/core/api/service.axios'

export interface PublishServicesRequest {
  service_ids: string[]
  section_ids: string[]
}

export interface PublishServicesResponse {
  success: boolean
  message: string
  addedCount: number
  updatedCount: number
}

export const publishServices = async (serviceIds: string[], sectionIds: string[]): Promise<PublishServicesResponse> => {
  const response = await api.post<PublishServicesResponse>('/api/admin/catalog/service-publish', {
    service_ids: serviceIds,
    section_ids: sectionIds
  })
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to publish services')
  }
  return response.data
}

export default publishServices

