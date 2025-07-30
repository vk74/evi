/**
 * service.delete.catalog.sections.ts - version 1.0.0
 * Service for deleting catalog sections from frontend.
 * 
 * Functionality:
 * - Sends delete request to backend API
 * - Handles multiple section deletion
 * - Provides detailed error handling
 * - Updates local state after successful deletion
 * - Shows user-friendly toast messages
 * 
 * Dependencies:
 * - Uses catalog admin store for state management
 * - Uses UI store for toast notifications
 * - Uses catalog sections fetch service for data refresh
 */

import { useCatalogAdminStore } from './state.catalog.admin'
import { useUiStore } from '@/core/state/uistate'
import { api } from '@/core/api/service.axios'
import catalogSectionsFetchService from './service.fetch.catalog.sections'
import type { 
    DeleteSectionRequest, 
    DeleteSectionResponse, 
    ApiError 
} from './types.catalog.admin'

// API endpoint
const DELETE_SECTIONS_ENDPOINT = '/api/admin/catalog/delete-section'

/**
 * Deletes selected catalog sections
 * @param sectionIds - Array of section IDs to delete
 * @returns Promise with deletion result
 */
export async function deleteCatalogSections(sectionIds: string[]): Promise<DeleteSectionResponse> {
    try {
        // Validate input
        if (!sectionIds || sectionIds.length === 0) {
            throw new Error('No section IDs provided for deletion')
        }

        // Prepare request data
        const requestData: DeleteSectionRequest = {
            ids: sectionIds
        }

        // Send delete request to API
        const response = await api.post<DeleteSectionResponse>(
            DELETE_SECTIONS_ENDPOINT,
            requestData
        )

        return response.data
    } catch (error) {
        console.error('[DeleteCatalogSectionsService] Error deleting sections:', error)
        
        // Handle API errors
        if (error && typeof error === 'object' && 'response' in error) {
            const apiError = error as { response: { data: ApiError } }
            throw new Error(apiError.response.data.message || 'Failed to delete sections')
        }
        
        // Handle network errors
        if (error instanceof Error) {
            throw error
        }
        
        throw new Error('Unknown error occurred while deleting sections')
    }
}

/**
 * Deletes selected sections and handles UI updates
 * @param sectionIds - Array of section IDs to delete
 * @param t - Translation function from useI18n()
 * @returns Promise<void>
 */
export async function deleteSectionsWithUIUpdate(sectionIds: string[], t: (key: string, values?: any) => string): Promise<void> {
    const catalogStore = useCatalogAdminStore()
    const uiStore = useUiStore()
    
    try {
        // Show loading state
        catalogStore.setLoading(true)
        
        // Delete sections
        const result = await deleteCatalogSections(sectionIds)
        
        // Handle different result scenarios
        if (result.success) {
            if (result.data) {
                const { totalDeleted, totalFailed, deleted, failed } = result.data
                
                // Show success message
                if (totalDeleted > 0) {
                    const message = totalFailed === 0 
                        ? t('admin.catalog.sections.messages.delete.success')
                        : t('admin.catalog.sections.messages.delete.partialSuccess', { 
                            deleted: totalDeleted, 
                            failed: totalFailed 
                          })
                    
                    uiStore.showSnackbar({
                        message,
                        type: 'success',
                        timeout: 5000,
                        closable: true,
                        position: 'bottom'
                    })
                    
                    // Show detailed error messages if any failed
                    if (failed && failed.length > 0) {
                        const errorDetails = failed.map(f => `${f.name || f.id}: ${f.error}`).join('\n')
                        console.warn('[DeleteCatalogSectionsService] Some sections failed to delete:', errorDetails)
                    }
                } else {
                    uiStore.showSnackbar({
                        message: t('admin.catalog.sections.messages.delete.noSectionsDeleted'),
                        type: 'warning',
                        timeout: 3000,
                        closable: true,
                        position: 'bottom'
                    })
                }
            }
        } else {
            // Show error message
            uiStore.showSnackbar({
                message: result.message || t('admin.catalog.sections.messages.delete.error'),
                type: 'error',
                timeout: 5000,
                closable: true,
                position: 'bottom'
            })
        }
        
        // Refresh sections list to update UI
        await catalogSectionsFetchService.refreshSections()
        
    } catch (error) {
        console.error('[DeleteCatalogSectionsService] Error in deleteSectionsWithUIUpdate:', error)
        
        // Show error message
        const errorMessage = error instanceof Error ? error.message : t('admin.catalog.sections.messages.delete.error')
        uiStore.showSnackbar({
            message: errorMessage,
            type: 'error',
            timeout: 5000,
            closable: true,
            position: 'bottom'
        })
        
    } finally {
        // Clear loading state
        catalogStore.setLoading(false)
    }
}

/**
 * Service object for export
 */
const catalogSectionsDeleteService = {
    deleteCatalogSections,
    deleteSectionsWithUIUpdate
}

export default catalogSectionsDeleteService 