/**
 * version: 1.0.0
 * Frontend service for deleting price lists.
 * 
 * This is a frontend file. The file provides API client for price lists deletion.
 * Logic: Handles HTTP requests to backend API with proper error handling and response processing.
 * 
 * File: service.delete.pricelists.ts
 */

import { api } from '@/core/api/service.axios'
import type { 
    DeletePriceListsRequest, 
    DeletePriceListsResult
} from '../types.pricing.admin'

/**
 * Frontend service for deleting price lists
 */
export const serviceDeletePriceLists = {
    /**
     * Deletes price lists via backend API
     * @param priceListIds - Array of price list IDs to delete
     * @returns Promise with deletion result or error
     */
    async deletePriceLists(priceListIds: number[]): Promise<DeletePriceListsResult> {
        try {
            // Validate input
            if (!Array.isArray(priceListIds) || priceListIds.length === 0) {
                return {
                    success: false,
                    message: 'Price list IDs array is required and must not be empty'
                }
            }

            // Prepare request data
            const requestData: DeletePriceListsRequest = {
                priceListIds
            }

            // Make API request
            const response = await api.post<DeletePriceListsResult>(
                '/api/admin/pricing/pricelists/delete',
                requestData
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
                    message: response.data.message || 'Failed to delete price lists'
                }
            }

        } catch (error: any) {
            console.error('Error deleting price lists:', error)
            
            // Handle specific error cases
            if (error.response) {
                return {
                    success: false,
                    message: error.response.data?.message || 'Server error while deleting price lists'
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

