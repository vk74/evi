/**
 * version: 1.0.0
 * Frontend service for updating regions list for admin settings module.
 * Frontend file that handles regions data updating via settings API endpoint.
 * 
 * Functionality:
 * - Sends regions data to the settings API endpoint for batch update
 * - Accepts array of region records (create, update, delete in one operation)
 * - Handles errors and logging
 */

import { api } from '@/core/api/service.axios'
import { useUiStore } from '@/core/state/uistate'
import type { UpdateRegionsRequest, UpdateRegionsResponse } from './types.admin.regions'

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[RegionsUpdateService] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[RegionsUpdateService] ${message}`, meta || '')
}

/**
 * Updates regions data via the settings API endpoint
 * @param regions Array of region records to save (full table state)
 * @returns Promise<number> Total number of records saved
 * @throws {Error} If an error occurs during the update operation
 */
export async function updateRegions(
    regions: Array<{
        region_id?: number
        region_name: string
        _delete?: boolean
    }>
): Promise<number> {
    const uiStore = useUiStore()

    try {
        logger.info('Updating regions data via settings API', {
            recordCount: regions.length
        })

        // Prepare request payload
        const payload: UpdateRegionsRequest = {
            regions
        }

        // Send update request to the API
        const response = await api.post<UpdateRegionsResponse>('/api/admin/settings/regions/update', payload)

        // Validate the response format
        if (!response.data || !response.data.success) {
            const errorMessage = response.data?.message || 'Invalid API response format'
            logger.error(errorMessage, { response: response.data })
            throw new Error(errorMessage)
        }

        const totalRecords = response.data.data?.totalRecords || 0

        logger.info('Successfully updated regions data', {
            totalRecords
        })

        uiStore.showSuccessSnackbar(`Регионы успешно сохранены (${totalRecords} записей)`)

        return totalRecords

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update regions'
        logger.error('Error updating regions:', { error })
        uiStore.showErrorSnackbar(`Ошибка сохранения регионов: ${errorMessage}`)
        throw new Error(errorMessage)
    }
}

export default { updateRegions }

