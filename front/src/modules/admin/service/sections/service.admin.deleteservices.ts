/**
 * service.admin.deleteservices.ts - version 1.0.0
 * Frontend service for deleting services with error handling.
 * 
 * Handles API calls to backend for services deletion functionality.
 * 
 * File: service.admin.deleteservices.ts
 * Created: 2024-12-19
 * Last updated: 2024-12-19
 */

import { api } from '@/core/api/service.axios'

// Request interface
export interface DeleteServicesRequest {
  serviceIds: string[]
}

// Response interface
export interface DeleteServicesResponse {
  success: boolean
  message: string
  data: {
    deletedServices: Array<{id: string, name: string}>
    errors: Array<{id: string, error: string}>
  }
}

/**
 * Deletes services by their IDs
 */
export const deleteServices = async (params: DeleteServicesRequest): Promise<DeleteServicesResponse> => {
  try {
    const response = await api.post<DeleteServicesResponse>(
      '/api/admin/services/deleteservices',
      params
    )
    
    return response.data
  } catch (error) {
    console.error('[DeleteServices] Error:', error)
    throw error
  }
} 