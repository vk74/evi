/**
 * version: 1.0.0
 * Frontend service for fetching a single price list by ID.
 * 
 * This is a frontend file. The file provides API client for single price list fetch operation.
 * Logic: Handles HTTP requests to backend API with proper error handling and response processing.
 * 
 * File: service.fetch.pricelist.ts
 */

import { api } from '@/core/api/service.axios'
import type { FetchPriceListResult } from '../types.pricing.admin'

/**
 * Frontend service for fetching a single price list
 */
export const serviceFetchPriceList = {
    /**
     * Fetches a single price list from backend API
     * @param priceListId - Price list ID
     * @returns Promise with fetch result or error
     */
    async fetchPriceList(priceListId: number): Promise<FetchPriceListResult> {
        try {
            // Validate input
            if (!priceListId || priceListId < 1) {
                return {
                    success: false,
                    message: 'Price list ID is required and must be greater than 0'
                }
            }

            // Make API request
            const response = await api.get<FetchPriceListResult>(
                '/api/admin/pricing/pricelists/fetch',
                { params: { id: priceListId } }
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
                    message: response.data.message || 'Failed to fetch price list'
                }
            }

        } catch (error: any) {
            console.error('Error fetching price list:', error)
            
            // Handle specific error cases
            if (error.response) {
                return {
                    success: false,
                    message: error.response.data?.message || 'Server error while fetching price list'
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

