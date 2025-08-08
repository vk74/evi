/**
 * service.admin.update.sections.publish.ts
 * Version: 1.0.0
 * Description: Frontend service to update (replace) catalog sections publish bindings for a service
 * Purpose: Sends POST request to /api/admin/services/update-sections-publish
 * Frontend file - service.admin.update.sections.publish.ts
 */

import { api } from '@/core/api/service.axios'

export interface UpdateSectionsPublishRequest {
  service_id: string
  section_ids: string[]
}

export interface UpdateSectionsPublishResponse {
  success: boolean
  message: string
  updatedCount: number
  addedCount: number
  removedCount: number
}

export async function updateServiceSectionsPublish(
  serviceId: string,
  sectionIds: string[]
): Promise<UpdateSectionsPublishResponse> {
  try {
    const payload: UpdateSectionsPublishRequest = {
      service_id: serviceId,
      section_ids: sectionIds
    }

    const { data } = await api.post<UpdateSectionsPublishResponse>(
      '/api/admin/services/update-sections-publish',
      payload
    )

    if (!data?.success) {
      throw new Error(data?.message || 'Failed to update sections publish')
    }

    return data
  } catch (error: any) {
    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message)
    }
    throw new Error(error?.message || 'Failed to update sections publish')
  }
}

export default updateServiceSectionsPublish


