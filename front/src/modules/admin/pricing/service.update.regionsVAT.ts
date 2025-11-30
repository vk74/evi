/**
 * version: 1.0.0
 * Frontend service for updating regions VAT list for pricing module.
 * Frontend file that handles regions VAT data updating via pricing API endpoint.
 * 
 * Functionality:
 * - Sends regions VAT data to the pricing API endpoint for update
 * - Accepts array of region VAT records with region_name, vat_rate, and priority
 * - Handles errors and logging
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'

// Types matching backend request/response
interface UpdateRegionsVATRequest {
    regionsVAT: Array<{
        region_name: string
        vat_rate: number
        priority: number
    }>
}

interface UpdateRegionsVATResponse {
    success: boolean
    message: string
    data?: {
        totalRecords: number
    }
}

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[RegionsVATUpdateService] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[RegionsVATUpdateService] ${message}`, meta || '')
}

/**
 * Updates regions VAT data via the pricing API endpoint
 * @param regionsVAT Array of region VAT records to save
 * @returns Promise<number> Total number of records saved
 * @throws {Error} If an error occurs during the update operation
 */
export async function updateRegionsVAT(
    regionsVAT: Array<{region_name: string, vat_rate: number, priority: number}>
): Promise<number> {
    const uiStore = useUiStore()

    try {
        logger.info('Updating regions VAT data via pricing API', {
            recordCount: regionsVAT.length
        })

        // Prepare request payload
        const payload: UpdateRegionsVATRequest = {
            regionsVAT
        }

        // Send update request to the API
        const response = await api.post<UpdateRegionsVATResponse>('/api/admin/pricing/regions-vat/update', payload)

        // Validate the response format
        if (!response.data || !response.data.success) {
            const errorMessage = response.data?.message || 'Invalid API response format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        const totalRecords = response.data.data?.totalRecords || 0

        logger.info('Successfully updated regions VAT data', {
            totalRecords
        })

        uiStore.showSuccessSnackbar(`Данные НДС успешно сохранены (${totalRecords} записей)`)

        return totalRecords

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update regions VAT'
        logger.error('Error updating regions VAT:', { error })
        uiStore.showErrorSnackbar(`Ошибка сохранения данных НДС: ${errorMessage}`)
        throw new Error(errorMessage)
    }
}

export default { updateRegionsVAT }

