/**
 * version: 1.0.0
 * Frontend service for fetching all price lists with pagination, search, sorting and filtering.
 * 
 * This is a frontend file. The file provides API client for price lists list operations.
 * Logic: Handles HTTP requests to backend API with proper error handling and response processing.
 * 
 * File: service.fetch.pricelists.ts
 */

import { api } from '@/core/api/service.axios'
import type { 
    FetchAllPriceListsParams, 
    FetchAllPriceListsResult
} from '../types.pricing.admin'

/**
 * Frontend service for fetching all price lists
 */
export const serviceFetchAllPriceLists = {
    /**
     * Fetches all price lists from backend API
     * @param params - Query parameters for pagination, search, sorting and filtering
     * @returns Promise with fetch result or error
     */
    async fetchAllPriceLists(params: FetchAllPriceListsParams): Promise<FetchAllPriceListsResult> {
        try {
            // Validate input
            if (!params.page || params.page < 1) {
                return {
                    success: false,
                    message: 'Page number is required and must be greater than 0'
                }
            }

            if (!params.itemsPerPage || params.itemsPerPage < 1) {
                return {
                    success: false,
                    message: 'Items per page is required and must be greater than 0'
                }
            }

            // Build query parameters
            const queryParams: Record<string, string> = {
                page: params.page.toString(),
                itemsPerPage: params.itemsPerPage.toString()
            }

            if (params.searchQuery && params.searchQuery.length >= 2) {
                queryParams.searchQuery = params.searchQuery
            }

            if (params.sortBy) {
                queryParams.sortBy = params.sortBy
                queryParams.sortDesc = params.sortDesc ? 'true' : 'false'
            }

            if (params.statusFilter && params.statusFilter !== 'all') {
                queryParams.statusFilter = params.statusFilter
            }

            if (params.currencyFilter && params.currencyFilter !== 'all') {
                queryParams.currencyFilter = params.currencyFilter
            }

            // Make API request
            const response = await api.get<FetchAllPriceListsResult>(
                '/api/admin/pricing/pricelists/fetchall',
                { params: queryParams }
            )

            // Check if request was successful
            if (response.data.success) {
                return {
                    success: true,
                    data: response.data.data
                }
            } else {
                return {
                    success: false,
                    message: response.data.message || 'Failed to fetch price lists'
                }
            }

        } catch (error: any) {
            console.error('Error fetching price lists:', error)
            
            // Handle specific error cases
            if (error.response) {
                return {
                    success: false,
                    message: error.response.data?.message || 'Server error while fetching price lists'
                }
            } else if (error.request) {
                return {
                    success: false,
                    message: 'No response from server'
                }
            } else {
                return {
                    success: false,
                    message: 'Error setting up request'
                }
            }
        }
    }
}

