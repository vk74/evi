/**
 * version: 1.0.0
 * Frontend service for updating taxable categories list for pricing module.
 * Frontend file that handles taxable categories data updating via pricing API endpoint.
 * 
 * Functionality:
 * - Sends taxable categories data to the pricing API endpoint for batch update
 * - Accepts array of category records (create, update, delete in one operation)
 * - Handles errors and logging
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import type { UpdateTaxableCategoriesRequest, UpdateTaxableCategoriesResult } from '@/modules/admin/pricing/types.pricing.admin'

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[TaxableCategoriesUpdateService] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[TaxableCategoriesUpdateService] ${message}`, meta || '')
}

/**
 * Updates taxable categories data via the pricing API endpoint
 * @param categories Array of category records to save (full table state)
 * @returns Promise<number> Total number of records saved
 * @throws {Error} If an error occurs during the update operation
 */
export async function updateTaxableCategories(
    categories: Array<{
        category_id?: number
        category_name: string
        _delete?: boolean
    }>
): Promise<number> {
    const uiStore = useUiStore()

    try {
        logger.info('Updating taxable categories data via pricing API', {
            recordCount: categories.length
        })

        // Prepare request payload
        const payload: UpdateTaxableCategoriesRequest = {
            categories
        }

        // Send update request to the API
        const response = await api.post<UpdateTaxableCategoriesResult>('/api/admin/pricing/taxable-categories/update', payload)

        // Validate the response format
        if (!response.data || !response.data.success) {
            const errorMessage = response.data?.message || 'Invalid API response format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        const totalRecords = response.data.data?.totalRecords || 0

        logger.info('Successfully updated taxable categories data', {
            totalRecords
        })

        uiStore.showSuccessSnackbar(`Налогооблагаемые категории успешно сохранены (${totalRecords} записей)`)

        return totalRecords

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update taxable categories'
        logger.error('Error updating taxable categories:', { error })
        uiStore.showErrorSnackbar(`Ошибка сохранения налогооблагаемых категорий: ${errorMessage}`)
        throw new Error(errorMessage)
    }
}

export default { updateTaxableCategories }

