/**
 * service.admin.delete.regions.ts - version 1.0.0
 * Frontend service for deleting regions with error handling.
 * 
 * Handles API calls to backend for regions deletion functionality.
 * 
 * File: service.admin.delete.regions.ts
 */

import { api } from '@/core/api/service.axios'
import type { DeleteRegionsRequest, DeleteRegionsResponse } from './types.admin.regions'

/**
 * Deletes regions by their IDs
 */
export const deleteRegions = async (params: DeleteRegionsRequest): Promise<DeleteRegionsResponse> => {
  try {
    const response = await api.post<DeleteRegionsResponse>(
      '/api/admin/settings/regions/delete',
      params
    )
    
    return response.data
  } catch (error) {
    console.error('[DeleteRegions] Error:', error)
    throw error
  }
}

