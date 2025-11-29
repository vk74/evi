/**
 * version: 1.0.0
 * Frontend service for fetching regions list for pricing module.
 * Frontend file that handles regions data fetching from pricing API endpoint.
 * 
 * Functionality:
 * - Fetches regions list from the pricing API endpoint
 * - Returns array of region names
 * - Handles errors and logging
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'

// Types matching backend response
interface RegionDto {
    region_id: number
    region_name: string
    created_at: Date
    updated_at: Date | null
}

interface FetchRegionsResponse {
    success: boolean
    message: string
    data?: {
        regions: RegionDto[]
    }
}

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[RegionsService] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[RegionsService] ${message}`, meta || '')
}

/**
 * Fetches the list of all regions from the pricing API endpoint
 * @returns Promise<string[]> Array of region names
 * @throws {Error} If an error occurs during the fetch operation
 */
export async function fetchRegions(): Promise<string[]> {
    const uiStore = useUiStore()

    try {
        logger.info('Fetching regions list from pricing API')

        // Fetch regions data from the API
        const response = await api.get<FetchRegionsResponse>('/api/admin/pricing/regions/fetchall')

        // Validate the response format
        if (!response.data || !response.data.success) {
            const errorMessage = response.data?.message || 'Invalid API response format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        if (!response.data.data || !Array.isArray(response.data.data.regions)) {
            const errorMessage = 'Invalid regions data format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        // Extract region names from response
        const regionNames = response.data.data.regions.map(region => region.region_name)

        logger.info('Successfully received regions data', {
            regionCount: regionNames.length
        })

        return regionNames

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch regions'
        logger.error('Error fetching regions:', { error })
        uiStore.showErrorSnackbar(`Ошибка загрузки регионов: ${errorMessage}`)
        throw new Error(errorMessage)
    }
}

export default { fetchRegions }

