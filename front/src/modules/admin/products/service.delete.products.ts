/**
 * service.delete.products.ts - version 1.0.0
 * Frontend service for deleting products via API.
 * 
 * This is a frontend file. The file provides API client for product deletion operations.
 * Logic: Handles HTTP requests to backend API with proper error handling and response processing.
 * 
 * File: service.delete.products.ts
 * Created: 2024-12-20
 * Last Updated: 2024-12-20
 */

import { api } from '@/core/api/service.axios'
import type { 
    DeleteProductsRequest, 
    DeleteProductsResult,
    DeleteProductsResponse
} from './types.products.admin'

/**
 * Frontend service for deleting products
 */
export const serviceDeleteProducts = {
    /**
     * Deletes products from backend API
     * @param productIds - Array of product IDs to delete
     * @returns Promise with deletion result or error
     */
    async deleteProducts(productIds: string[]): Promise<DeleteProductsResult> {
        try {
            // Validate input
            if (!Array.isArray(productIds) || productIds.length === 0) {
                return {
                    success: false,
                    message: 'Product IDs array is required and must not be empty'
                }
            }

            // Prepare request data
            const requestData: DeleteProductsRequest = {
                productIds
            }

            // Make API request
            const response = await api.post<DeleteProductsResponse>(
                '/api/admin/products/delete',
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
                    message: response.data.message || 'Failed to delete products'
                }
            }

        } catch (error: any) {
            console.error('Error deleting products:', error)
            
            // Handle different error types
            if (error.response?.status === 401) {
                return {
                    success: false,
                    message: 'Authentication required. Please log in again.'
                }
            } else if (error.response?.status === 403) {
                return {
                    success: false,
                    message: 'Access denied. You do not have permission to delete products.'
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
                    message: 'An unexpected error occurred while deleting products.'
                }
            }
        }
    }
}

// Export singleton instance
export default serviceDeleteProducts
