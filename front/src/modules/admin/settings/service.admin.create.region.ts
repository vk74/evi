/**
 * service.admin.create.region.ts - version 1.0.0
 * Frontend service for creating regions.
 * 
 * Handles API calls to backend for region creation functionality.
 * 
 * File: service.admin.create.region.ts
 */

import { api } from '@/core/api/service.axios'
import type { CreateRegionRequest, CreateRegionResponse } from './types.admin.regions'

/**
 * Creates a new region
 */
export const createRegion = async (params: CreateRegionRequest): Promise<CreateRegionResponse> => {
  try {
    const response = await api.post<CreateRegionResponse>(
      '/api/admin/settings/regions/create',
      params
    )
    
    return response.data
  } catch (error) {
    console.error('[CreateRegion] Error:', error)
    throw error
  }
}

