/**
 * version: 1.1.3
 * Frontend service for creating price lists.
 * 
 * This is a frontend file. The file provides API client for price list creation.
 * Logic: Handles HTTP requests to backend API with proper error handling and response processing.
 * 
 * File: service.create.pricelist.ts
 * 
 * Changes in v1.2.0:
 */

import { api } from '@/core/api/service.axios'
import type { 
    CreatePriceListRequest, 
    CreatePriceListResult
} from '../types.pricing.admin'

/**
 * Frontend service for creating price lists
 */
export const serviceCreatePriceList = {
    /**
     * Creates a new price list via backend API
     * @param data - Price list creation data
     * @returns Promise with creation result or error
     */
    async createPriceList(data: CreatePriceListRequest): Promise<CreatePriceListResult> {
        try {
            // Validate input
            if (!data.name || data.name.trim().length < 2) {
                return {
                    success: false,
                    message: 'Price list name is required and must be at least 2 characters'
                }
            }

            if (!data.currency_code || data.currency_code.trim().length !== 3) {
                return {
                    success: false,
                    message: 'Currency code is required and must be 3 characters'
                }
            }

            // Make API request
            const response = await api.post<CreatePriceListResult>(
                '/api/admin/pricing/pricelists/create',
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
                    message: response.data.message || 'Failed to create price list'
                }
            }

        } catch (error: any) {
            console.error('Error creating price list:', error)
            
            // Handle specific error cases
            if (error.response) {
                return {
                    success: false,
                    message: error.response.data?.message || 'Server error while creating price list'
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

