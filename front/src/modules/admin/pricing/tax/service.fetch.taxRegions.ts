/**
 * version: 1.0.0
 * Frontend service for fetching tax regions bindings data for pricing module.
 * Frontend file that handles tax regions data fetching from pricing API endpoint.
 * 
 * Functionality:
 * - Fetches regions, categories and bindings from the pricing API endpoint
 * - Returns structured data for all regions
 * - Handles errors and logging
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import type { FetchTaxRegionsResult } from '@/modules/admin/pricing/types.pricing.admin'

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[TaxRegionsService] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[TaxRegionsService] ${message}`, meta || '')
}

/**
 * Fetches tax regions data (regions, categories and bindings) from the pricing API endpoint
 * @returns Promise<FetchTaxRegionsResult['data']> Structured data with regions, categories and bindings
 * @throws {Error} If an error occurs during the fetch operation
 */
export async function fetchTaxRegions(): Promise<FetchTaxRegionsResult['data']> {
    const uiStore = useUiStore()

    try {
        logger.info('Fetching tax regions data from pricing API')

        // Fetch tax regions data from the API
        const response = await api.get<FetchTaxRegionsResult>('/api/admin/pricing/tax-regions/fetchall')

        // Validate the response format
        if (!response.data || !response.data.success) {
            const errorMessage = response.data?.message || 'Invalid API response format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        if (!response.data.data) {
            const errorMessage = 'Invalid tax regions data format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        // Validate data structure
        if (!Array.isArray(response.data.data.regions) || 
            !Array.isArray(response.data.data.categories) || 
            !Array.isArray(response.data.data.bindings)) {
            const errorMessage = 'Invalid tax regions data structure'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        logger.info('Successfully received tax regions data', {
            regionsCount: response.data.data.regions.length,
            categoriesCount: response.data.data.categories.length,
            bindingsCount: response.data.data.bindings.length
        })

        return response.data.data

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tax regions data'
        logger.error('Error fetching tax regions data:', { error })
        uiStore.showErrorSnackbar(`Ошибка загрузки данных о налоговых ставках регионов: ${errorMessage}`)
        throw new Error(errorMessage)
    }
}

export default { fetchTaxRegions }

