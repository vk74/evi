/**
 * service.admin.fetchallservices.ts - version 1.0.0
 * Frontend service for fetching all services with pagination, search and sorting.
 * 
 * Handles API calls to backend for services list functionality.
 * 
 * File: service.admin.fetchallservices.ts
 * Created: 2024-12-19
 * Last updated: 2024-12-19
 */

import { api } from '@/core/api/service.axios'
import type { Service } from '../types.services.admin'

// Request parameters interface
export interface FetchServicesParams {
  page: number
  itemsPerPage: number
  searchQuery?: string
  sortBy?: string
  sortDesc?: boolean
}

// Response interface
export interface FetchServicesResponse {
  success: boolean
  message: string
  data: {
    services: Service[]
    pagination: {
      totalItems: number
      totalPages: number
      currentPage: number
      itemsPerPage: number
    }
  }
}

/**
 * Fetches all services with pagination, search and sorting
 */
export const fetchAllServices = async (params: FetchServicesParams): Promise<FetchServicesResponse> => {
  try {
    const queryParams = new URLSearchParams()
    
    // Add parameters to query string
    queryParams.append('page', params.page.toString())
    queryParams.append('itemsPerPage', params.itemsPerPage.toString())
    
    if (params.searchQuery) {
      queryParams.append('searchQuery', params.searchQuery)
    }
    
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy)
    }
    
    if (params.sortDesc !== undefined) {
      queryParams.append('sortDesc', params.sortDesc.toString())
    }
    
    const response = await api.get<FetchServicesResponse>(
      `/api/admin/services/fetchallservices?${queryParams.toString()}`
    )
    
    return response.data
  } catch (error) {
    console.error('[FetchAllServices] Error:', error)
    throw error
  }
} 