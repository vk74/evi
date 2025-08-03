/**
 * service.admin.fetchsingleservice.ts
 * Version: 1.0.0
 * Description: Service for fetching single service data by ID
 * Purpose: Provides API calls to fetch detailed service information
 * Frontend file - service.admin.fetchsingleservice.ts
 * Created: 2024-12-19
 * Last Updated: 2024-12-19
 */

import { api } from '@/core/api/service.axios'
import type { Service, ApiResponse } from '../../types.services.admin'

// Response interface for single service fetch
export interface FetchSingleServiceResponse extends ApiResponse {
  data?: Service
}

/**
 * Service class for fetching single service data
 */
export class ServiceAdminFetchSingleService {
  /**
   * Fetches single service data by ID
   * @param serviceId - The UUID of the service to fetch
   * @returns Promise with service data or error
   */
  async fetchSingleService(serviceId: string): Promise<FetchSingleServiceResponse> {
    try {
      const response = await api.get(`/api/admin/services/fetchsingleservice`, {
        params: { id: serviceId }
      })

      return {
        success: true,
        message: 'Service data fetched successfully',
        data: response.data
      }
    } catch (error: any) {
      console.error('Error fetching single service:', error)
      
      // Handle different error types
      if (error.response) {
        const status = error.response.status
        const errorData = error.response.data

        switch (status) {
          case 400:
            return {
              success: false,
              message: 'Invalid service ID format'
            }
          case 403:
            return {
              success: false,
              message: 'Access denied to service data'
            }
          case 404:
            return {
              success: false,
              message: 'Service not found'
            }
          case 500:
            return {
              success: false,
              message: 'Internal server error while fetching service data'
            }
          default:
            return {
              success: false,
              message: errorData?.message || 'Unknown error occurred while fetching service data'
            }
        }
      }

      // Network or other errors
      return {
        success: false,
        message: 'Network error occurred while fetching service data'
      }
    }
  }
}

// Export singleton instance
export const serviceAdminFetchSingleService = new ServiceAdminFetchSingleService() 