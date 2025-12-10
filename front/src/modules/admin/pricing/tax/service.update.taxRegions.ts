/**
 * version: 1.1.0
 * Frontend service for updating tax regions bindings for pricing module.
 * Frontend file that handles tax regions bindings updating via pricing API endpoint.
 * 
 * Functionality:
 * - Sends tax regions bindings data to the pricing API endpoint for batch update
 * - Accepts bindings for one region (create, update, delete in one operation)
 * - Handles errors and logging
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import type { UpdateTaxRegionsRequest, UpdateTaxRegionsResult } from '@/modules/admin/pricing/types.pricing.admin'

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[TaxRegionsUpdateService] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[TaxRegionsUpdateService] ${message}`, meta || '')
}

/**
 * Updates tax regions bindings data via the pricing API endpoint
 * @param regionId Region ID to update bindings for
 * @param bindings Array of binding records for the region
 * @returns Promise<UpdateTaxRegionsResult['data']> Update result with counts
 * @throws {Error} If an error occurs during the update operation
 */
export async function updateTaxRegions(
    regionId: number,
    bindings: Array<{
        id?: number
        category_name: string
        vat_rate: number | null
        _delete?: boolean
    }>
): Promise<UpdateTaxRegionsResult['data']> {
    const uiStore = useUiStore()

    try {
        logger.info('Updating tax regions bindings via pricing API', {
            regionId,
            bindingsCount: bindings.length
        })

        // Prepare request payload
        const payload: UpdateTaxRegionsRequest = {
            region_id: regionId,
            bindings
        }

        // Send update request to the API
        const response = await api.post<UpdateTaxRegionsResult>('/api/admin/pricing/tax-regions/update', payload)

        // Validate the response format
        if (!response.data || !response.data.success) {
            const errorMessage = response.data?.message || 'Invalid API response format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        const resultData = response.data.data

        if (!resultData) {
            const errorMessage = 'Invalid update response data format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        logger.info('Successfully updated tax regions bindings', {
            regionId,
            totalBindings: resultData.totalBindings,
            created: resultData.created,
            updated: resultData.updated,
            deleted: resultData.deleted
        })

        uiStore.showSuccessSnackbar(`Налоговые ставки для региона успешно сохранены (${resultData.totalBindings} привязок)`)

        return resultData

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update tax regions bindings'
        logger.error('Error updating tax regions bindings:', { error })
        uiStore.showErrorSnackbar(`Ошибка сохранения налоговых ставок регионов: ${errorMessage}`)
        throw new Error(errorMessage)
    }
}

export default { updateTaxRegions }
