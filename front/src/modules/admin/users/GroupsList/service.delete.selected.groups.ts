/**
 * @file service.delete.selected.groups.ts
 * Version: 1.0.0
 * Frontend service for deleting selected groups.
 * Frontend file that handles group deletion requests, cache management, and error handling.
 *
 * Functionality:
 * - Sends a request to delete selected groups by their IDs.
 * - Clears the cache and reloads the groups list after successful deletion.
 * - Handles errors and logging.
 */

import { api } from '@/core/api/service.axios'; // Axios instance
import { useStoreGroupsList } from './state.groups.list'; // Groups store
import { useUiStore } from '@/core/state/uistate'; // UI store
import { useUserAuthStore } from '@/core/auth/state.user.auth'; // User store
import type { GroupError } from './types.groups.list'; // Types

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[DeleteGroupsService] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[DeleteGroupsService] ${message}`, meta || '')
};

/**
 * Service for deleting selected groups
 */
export const deleteSelectedGroupsService = {
    /**
     * Deletes selected groups by their IDs
     * @param groupIds - Array of group UUIDs to delete
     * @returns Promise<number> - Number of deleted groups
     * @throws {GroupError} - If an error occurs
     */
    async deleteSelectedGroups(groupIds: string[]): Promise<number> {
        const store = useStoreGroupsList();
        const userStore = useUserAuthStore();
        const uiStore = useUiStore();

        // Check user authentication
        if (!userStore.isAuthenticated) {
            const errorMessage = 'User not authenticated';
            logger.error(errorMessage);
            throw new Error(errorMessage);
        }

        // Log operation start
        logger.info('Starting delete operation', { groupIds });

        try {
            // Send delete request for groups
            const response = await api.post<{ deletedCount: number }>(
                '/api/admin/groups/delete-selected-groups',
                { groupIds }
            );

            // Check response
            if (!response.data || typeof response.data.deletedCount !== 'number') {
                const errorMessage = 'Invalid API response format';
                logger.error(errorMessage);
                throw new Error(errorMessage);
            }

            // Log successful deletion
            logger.info('Successfully deleted groups', { deletedCount: response.data.deletedCount });

            // Clear cache in store
            store.clearCache();
            logger.info('Cache cleared in the frontend store');

            // Return number of deleted groups
            return response.data.deletedCount;

        } catch (error: unknown) {
            // Log the error
            if (error instanceof Error) {
                logger.error('Error during groups deletion', { message: error.message, stack: error.stack });
            } else {
                logger.error('Error during groups deletion', { error });
            }

            // Create an error object for display
            const groupError: GroupError = {
                code: 'DELETE_GROUPS_ERROR',
                message: 'Failed to delete selected groups',
                details: process.env.NODE_ENV === 'development' ?
                    (error instanceof Error ? error.message : String(error)) :
                    undefined
            };

            // Show error notification
            uiStore.showErrorSnackbar(groupError.message);

            // Throw the GroupError
            throw groupError;
        }
    }
};

export default deleteSelectedGroupsService;