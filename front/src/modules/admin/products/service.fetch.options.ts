/**
 * service.fetch.options.ts - version 1.0.0
 * Frontend service for fetching options (products with type 'option' or 'productAndOption').
 * 
 * This is a frontend file. The file provides API client for options list operations.
 * Logic: Handles HTTP requests to backend API with proper error handling and response processing.
 * 
 * File: service.fetch.options.ts
 * Created: 2024-12-20
 * Last Updated: 2024-12-20
 */

import { api } from '@/core/api/service.axios'
import type { 
    FetchAllProductsParams, 
    FetchAllProductsResult,
    ProductListItem 
} from './types.products.admin'

/**
 * Interface for API request parameters for options
 */
export interface FetchOptionsRequest {
    page?: number
    itemsPerPage?: number
    searchQuery?: string
    sortBy?: string
    sortDesc?: boolean
    language?: string
}

/**
 * Interface for API response for options
 */
export interface FetchOptionsResponse {
    success: boolean
    message: string
    data?: {
        options: ProductListItem[]
        pagination: {
            currentPage: number
            itemsPerPage: number
            totalItems: number
            totalPages: number
        }
    }
}

/**
 * Service for fetching options
 */
export const serviceFetchOptions = {
    /**
     * Fetches options (products with type 'option' or 'productAndOption')
     * @param params - Request parameters
     * @returns Promise<FetchAllProductsResult>
     */
    async fetchOptions(params: FetchOptionsRequest): Promise<FetchAllProductsResult> {
        try {
            const queryParams = new URLSearchParams()
            
            // Add pagination parameters
            if (params.page) queryParams.append('page', params.page.toString())
            if (params.itemsPerPage) queryParams.append('itemsPerPage', params.itemsPerPage.toString())
            
            // Add search parameters
            if (params.searchQuery) queryParams.append('searchQuery', params.searchQuery)
            
            // Add sorting parameters
            if (params.sortBy) queryParams.append('sortBy', params.sortBy)
            if (params.sortDesc !== undefined) queryParams.append('sortDesc', params.sortDesc.toString())
            
            // Add language parameter
            const languageToUse = params.language || 'en'
            queryParams.append('language', languageToUse)
            
            console.log('[ServiceFetchOptions] Sending request:', `/api/admin/products/fetch-options?${queryParams.toString()}`)

            const response = await api.get<FetchOptionsResponse>(
                `/api/admin/products/fetch-options?${queryParams.toString()}`
            )

            if (response.data.success && response.data.data) {
                return {
                    success: true,
                    message: response.data.message,
                    data: {
                        products: response.data.data.options,
                        pagination: response.data.data.pagination
                    }
                }
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Failed to fetch options',
                    data: undefined
                }
            }

        } catch (error: any) {
            console.error('[ServiceFetchOptions] Error fetching options:', error)
            
            let errorMessage = 'Failed to fetch options'
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error.message) {
                errorMessage = error.message
            }

            return {
                success: false,
                message: errorMessage,
                data: undefined
            }
        }
    }
}

export default serviceFetchOptions
