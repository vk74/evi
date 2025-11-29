/**
 * Version: 1.0.0
 * Service for getting regions list from backend.
 * Frontend file that provides function to get available regions.
 * Filename: service.get.regions.ts (frontend)
 */

import { api } from '@/core/api/service.axios'

interface GetRegionsResponse {
  success?: boolean
  message?: string
  data?: {
    regions: string[]
  }
  error?: string
}

/**
 * Get regions list from backend
 * @returns Promise with array of region names
 */
export async function getRegions(): Promise<string[]> {
  const response = await api.get<GetRegionsResponse>(
    '/api/admin/location-selection/regions'
  )
  
  if (response.data.error) {
    throw new Error(response.data.error || 'Failed to get regions list')
  }
  
  if (response.data.data?.regions) {
    return response.data.data.regions
  }
  
  return []
}

