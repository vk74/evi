/**
 * service.admin.fetch.regions.ts - version 1.0.0
 * Frontend service for fetching all regions.
 * 
 * Handles API calls to backend for regions list functionality.
 * 
 * File: service.admin.fetch.regions.ts
 */

import { api } from '@/core/api/service.axios'
import type { FetchRegionsResponse } from './types.admin.regions'

/**
 * Fetches all regions
 */
export const fetchAllRegions = async (): Promise<FetchRegionsResponse> => {
  try {
    const response = await api.get<FetchRegionsResponse>(
      '/api/admin/settings/regions/fetchall'
    )
    
    return response.data
  } catch (error) {
    console.error('[FetchAllRegions] Error:', error)
    throw error
  }
}

