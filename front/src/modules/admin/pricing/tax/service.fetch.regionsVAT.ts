/**
 * version: 1.0.0
 * Frontend service for fetching regions VAT list for pricing module.
 * Frontend file that handles regions VAT data fetching from pricing API endpoint.
 * 
 * Functionality:
 * - Fetches regions VAT list from the pricing API endpoint
 * - Returns array of region VAT records with region_name, vat_rate, and priority
 * - Handles errors and logging
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'

// Types matching backend response
interface RegionsVATDto {
    id: number
    region_name: string
    vat_rate: number
    priority: number
    created_at: Date
    updated_at: Date | null
}

interface FetchRegionsVATResponse {
    success: boolean
    message: string
    data?: {
        regionsVAT: RegionsVATDto[]
    }
}

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[RegionsVATService] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[RegionsVATService] ${message}`, meta || '')
}

/**
 * Fetches the list of all regions VAT from the pricing API endpoint
 * @returns Promise<Array<{region_name: string, vat_rate: number, priority: number}>> Array of region VAT records
 * @throws {Error} If an error occurs during the fetch operation
 */
export async function fetchRegionsVAT(): Promise<Array<{region_name: string, vat_rate: number, priority: number}>> {
    const uiStore = useUiStore()

    try {
        logger.info('Fetching regions VAT list from pricing API')

        // Fetch regions VAT data from the API
        const response = await api.get<FetchRegionsVATResponse>('/api/admin/pricing/regions-vat/fetchall')

        // Validate the response format
        if (!response.data || !response.data.success) {
            const errorMessage = response.data?.message || 'Invalid API response format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        if (!response.data.data || !Array.isArray(response.data.data.regionsVAT)) {
            const errorMessage = 'Invalid regions VAT data format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        // Extract and transform region VAT records
        const regionsVAT = response.data.data.regionsVAT.map(record => ({
            region_name: record.region_name,
            vat_rate: record.vat_rate,
            priority: record.priority
        }))

        logger.info('Successfully received regions VAT data', {
            recordCount: regionsVAT.length
        })

        return regionsVAT

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch regions VAT'
        logger.error('Error fetching regions VAT:', { error })
        uiStore.showErrorSnackbar(`Ошибка загрузки данных НДС: ${errorMessage}`)
        throw new Error(errorMessage)
    }
}

export default { fetchRegionsVAT }

