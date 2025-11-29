/**
 * service.admin.update.region.ts - version 1.0.0
 * Frontend service for updating regions.
 * 
 * Handles API calls to backend for region update functionality.
 * 
 * File: service.admin.update.region.ts
 */

import { api } from '@/core/api/service.axios'
import type { UpdateRegionRequest, UpdateRegionResponse } from './types.admin.regions'

/**
 * Updates an existing region
 */
export const updateRegion = async (params: UpdateRegionRequest): Promise<UpdateRegionResponse> => {
  try {
    const response = await api.post<UpdateRegionResponse>(
      '/api/admin/settings/regions/update',
      params
    )
    
    return response.data
  } catch (error) {
    console.error('[UpdateRegion] Error:', error)
    throw error
  }
}

