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
import { validatePriceListDatesForUpdate } from '../helpers/date.validation.helper'

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
        try {
            // Validate input
            if (!data.price_list_id || data.price_list_id < 1) {
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

            // Validate dates (only if being updated)
            // Note: We don't have current values here, so backend will handle cross-validation
            // Frontend only validates that new dates (if provided) are not in past
            if (data.valid_from !== undefined || data.valid_to !== undefined) {
                const dateValidation = validatePriceListDatesForUpdate(
                    data.valid_from,
                    data.valid_to
                )
                
                if (!dateValidation.isValid) {
                    return {
                        success: false,
                        message: dateValidation.error || 'Invalid dates'
                    }
                }
            }

            // Make API request
            const response = await api.post<UpdatePriceListResult>(
                '/api/admin/pricing/pricelists/update',
                data
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

