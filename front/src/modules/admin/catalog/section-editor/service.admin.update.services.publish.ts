/**
 * version: 1.0.0
 * Frontend service to update (replace) selected services published in a section
 * File type: frontend TypeScript (service.admin.update.services.publish.ts)
 * Purpose: POST /api/admin/catalog/update-services-publish
 */

import { api } from '@/core/api/service.axios'

export interface UpdateSectionServicesPublishResponse {
  success: boolean
  message: string
  addedCount: number
  removedCount: number
}

export const updateSectionServicesPublish = async (sectionId: string, serviceIds: string[]) => {
  const response = await api.post<UpdateSectionServicesPublishResponse>('/api/admin/catalog/update-services-publish', {
    section_id: sectionId,
    service_ids: serviceIds
  })
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to update services publish')
  }
  return response.data
}

export default updateSectionServicesPublish


