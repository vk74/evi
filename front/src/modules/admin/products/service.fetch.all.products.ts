/**
 * service.fetch.all.products.ts - version 1.1.0
 * Frontend service for fetching all products with pagination, search, sorting and filtering.
 * 
 * This is a frontend file. The file provides API client for products list operations.
 * Logic: Handles HTTP requests to backend API with proper error handling and response processing.
 * 
 * File: service.fetch.all.products.ts
 * Created: 2024-12-20
 * Last Updated: 2024-12-20
 * 
 * Changes in v1.1.0:
 * - Added statusFilter parameter to FetchAllProductsRequest interface
 * - Added statusFilter to query parameters in fetchAllProducts method
 */

import { api } from '@/core/api/service.axios'
import type { 
    FetchAllProductsParams, 
    FetchAllProductsResult,
    ProductListItem 
} from './types.products.admin'

/**
 * Interface for API request parameters
 */
export interface FetchAllProductsRequest {
    page?: number
    itemsPerPage?: number
    searchQuery?: string
    sortBy?: string
    sortDesc?: boolean
    typeFilter?: string
    publishedFilter?: string
    statusFilter?: string
    language?: string
}

/**
 * Interface for API response
 */
export interface FetchAllProductsResponse {
    success: boolean
    message: string
    data?: {
        products: ProductListItem[]
        pagination: {
            totalItems: number
            totalPages: number
            currentPage: number
            itemsPerPage: number
        }
    }
}

/**
 * Frontend service for fetching all products
 */
export class ServiceFetchAllProducts {

    /**
     * Fetches all products from backend API
     * @param params - Query parameters for filtering and pagination
     * @returns Promise with products list or error
     */
    async fetchAllProducts(params: FetchAllProductsRequest): Promise<FetchAllProductsResult> {
        try {
            // Prepare query parameters
            const queryParams = new URLSearchParams()
            
            if (params.page !== undefined) {
                queryParams.append('page', params.page.toString())
            }
            if (params.itemsPerPage !== undefined) {
                queryParams.append('itemsPerPage', params.itemsPerPage.toString())
            }
            if (params.searchQuery) {
                queryParams.append('searchQuery', params.searchQuery)
            }
            if (params.sortBy) {
                queryParams.append('sortBy', params.sortBy)
            }
            if (params.sortDesc !== undefined) {
                queryParams.append('sortDesc', params.sortDesc.toString())
            }
            if (params.typeFilter) {
                queryParams.append('typeFilter', params.typeFilter)
            }
            if (params.publishedFilter) {
                queryParams.append('publishedFilter', params.publishedFilter)
            }
            if (params.statusFilter && params.statusFilter !== 'all') {
                queryParams.append('statusFilter', params.statusFilter)
            }
            
            // Add language parameter (use provided language or default to 'en')
            const languageToUse = params.language || 'en'
            queryParams.append('language', languageToUse)

            // Make API request
            const response = await api.get<FetchAllProductsResponse>(
                `/api/admin/products/fetch-all-products?${queryParams.toString()}`
            )

            // Check if request was successful
            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message,
                    data: response.data.data
                }
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Failed to fetch products'
                }
            }

        } catch (error: any) {
            console.error('Error fetching products:', error)
            
            // Handle different error types
            if (error.response?.status === 401) {
                return {
                    success: false,
                    message: 'Authentication required. Please log in again.'
                }
            } else if (error.response?.status === 403) {
                return {
                    success: false,
                    message: 'Access denied. You do not have permission to view products.'
                }
            } else if (error.response?.status >= 500) {
                return {
                    success: false,
                    message: 'Server error. Please try again later.'
                }
            } else if (error.response?.data?.message) {
                return {
                    success: false,
                    message: error.response.data.message
                }
            } else if (error.message) {
                return {
                    success: false,
                    message: error.message
                }
            } else {
                return {
                    success: false,
                    message: 'An unexpected error occurred while fetching products.'
                }
            }
        }
    }

    /**
     * Fetches products with default parameters
     * @returns Promise with products list or error
     */
    async fetchProductsDefault(): Promise<FetchAllProductsResult> {
        return this.fetchAllProducts({
            page: 1,
            itemsPerPage: 25,
            sortBy: 'product_code',
            sortDesc: false
        })
    }
}

// Export singleton instance
export const serviceFetchAllProducts = new ServiceFetchAllProducts()
