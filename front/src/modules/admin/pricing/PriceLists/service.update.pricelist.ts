/**
 * version: 1.0.1
 * Frontend service for updating price lists.
 * 
 * This is a frontend file. The file provides API client for price list update.
 * Logic: Handles HTTP requests to backend API with proper error handling and response processing.
 * Includes conditional date validation - only validates dates if they are being updated.
 * 
 * File: service.update.pricelist.ts
 */

import { api } from '@/core/api/service.axios'
import type { 
    UpdatePriceListRequest, 
    UpdatePriceListResult
} from '../types.pricing.admin'

/**
 * Frontend service for updating price lists
 */
export const serviceUpdatePriceList = {
    /**
     * Updates an existing price list via backend API
     * @param data - Price list update data
     * @returns Promise with update result or error
     */
    async updatePriceList(data: UpdatePriceListRequest): Promise<UpdatePriceListResult> {
        console.log('=== serviceUpdatePriceList.updatePriceList DEBUG ===')
        console.log('Input data:', data)
        console.log('Data types:', {
            price_list_id: typeof data.price_list_id,
            name: typeof data.name,
            currency_code: typeof data.currency_code,
            valid_from: typeof data.valid_from,
            valid_to: typeof data.valid_to
        })
        
        try {
            // Validate input
            if (!data.price_list_id || data.price_list_id < 1) {
                console.log('Validation failed: invalid price_list_id')
                return {
                    success: false,
                    message: 'Price list ID is required and must be greater than 0'
                }
            }

            if (data.name !== undefined && data.name.trim().length < 2) {
                return {
                    success: false,
                    message: 'Price list name must be at least 2 characters'
                }
            }

            if (data.currency_code !== undefined && data.currency_code.trim().length !== 3) {
                return {
                    success: false,
                    message: 'Currency code must be 3 characters'
                }
            }

            // Note: Date validation is already performed in handleDateUpdate with current values
            // Backend will handle final validation and cross-validation
            if (data.valid_from !== undefined || data.valid_to !== undefined) {
                console.log('Dates are being updated, validation already performed in component')
            }

            console.log('Making API request to /api/admin/pricing/pricelists/update')
            console.log('Request payload:', data)
            
            // Make API request
            const response = await api.post<UpdatePriceListResult>(
                '/api/admin/pricing/pricelists/update',
                data
            )
            
            console.log('API response:', response.data)

            // Check if request was successful
            if (response.data.success) {
                console.log('API request successful')
                console.log('=== END serviceUpdatePriceList.updatePriceList DEBUG ===')
                return {
                    success: true,
                    message: response.data.message,
                    data: response.data.data
                }
            } else {
                console.log('API request failed:', response.data.message)
                console.log('=== END serviceUpdatePriceList.updatePriceList DEBUG ===')
                return {
                    success: false,
                    message: response.data.message || 'Failed to update price list'
                }
            }

        } catch (error: any) {
            console.error('Error updating price list:', error)
            
            // Handle specific error cases
            if (error.response) {
                return {
                    success: false,
                    message: error.response.data?.message || 'Server error while updating price list'
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

