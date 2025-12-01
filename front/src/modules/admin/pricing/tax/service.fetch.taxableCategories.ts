/**
 * version: 1.1.0
 * Frontend service for fetching taxable categories list for pricing module.
 * Frontend file that handles taxable categories data fetching from pricing API endpoint.
 * 
 * Functionality:
 * - Fetches taxable categories list from the pricing API endpoint
 * - Returns array of taxable category records
 * - Handles errors and logging
 * 
 * Changes in v1.1.0:
 * - Updated to include region field in category mapping
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import type { FetchTaxableCategoriesResult, TaxableCategory } from '@/modules/admin/pricing/types.pricing.admin'

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[TaxableCategoriesService] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[TaxableCategoriesService] ${message}`, meta || '')
}

/**
 * Fetches the list of all taxable categories from the pricing API endpoint
 * @returns Promise<TaxableCategory[]> Array of taxable category records
 * @throws {Error} If an error occurs during the fetch operation
 */
export async function fetchTaxableCategories(): Promise<TaxableCategory[]> {
    const uiStore = useUiStore()

    try {
        logger.info('Fetching taxable categories list from pricing API')

        // Fetch taxable categories data from the API
        const response = await api.get<FetchTaxableCategoriesResult>('/api/admin/pricing/taxable-categories/fetchall')

        // Validate the response format
        if (!response.data || !response.data.success) {
            const errorMessage = response.data?.message || 'Invalid API response format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        if (!response.data.data || !Array.isArray(response.data.data)) {
            const errorMessage = 'Invalid taxable categories data format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        // Extract and transform category records
        const categories: TaxableCategory[] = response.data.data.map(record => ({
            category_id: record.category_id,
            category_name: record.category_name,
            region: record.region || null,
            created_at: record.created_at,
            updated_at: record.updated_at
        }))

        logger.info('Successfully received taxable categories data', {
            recordCount: categories.length
        })

        return categories

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch taxable categories'
        logger.error('Error fetching taxable categories:', { error })
        uiStore.showErrorSnackbar(`Ошибка загрузки налогооблагаемых категорий: ${errorMessage}`)
        throw new Error(errorMessage)
    }
}

export default { fetchTaxableCategories }

