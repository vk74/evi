/**
 * @file service.delete.selected.groups.ts
 * Version: 1.0.1
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

type DeleteGroupsResponse = {
    success: boolean;
    message: string;
    deleted: { ids: string[]; names: string[]; count: number };
    forbidden?: { ids: string[]; names: string[]; count: number };
};

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
    async deleteSelectedGroups(groupIds: string[]): Promise<DeleteGroupsResponse> {
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
            const { data } = await api.post<DeleteGroupsResponse>(
                '/api/admin/groups/delete-selected-groups',
                { groupIds }
            );

            // Validate minimal shape
            if (!data || typeof data.success !== 'boolean' || typeof data.message !== 'string') {
                const errorMessage = 'Invalid API response format';
                logger.error(errorMessage);
                throw new Error(errorMessage);
            }

            // Clear cache in store
            store.clearCache();
            logger.info('Cache cleared in the frontend store');

            // Toast based on backend message
            if (data.success) {
                uiStore.showSuccessSnackbar(data.message);
            } else if (data.forbidden && data.forbidden.count > 0) {
                uiStore.showErrorSnackbar(`${data.message}`);
            } else {
                uiStore.showInfoSnackbar(data.message);
            }

            return data;

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
                details: import.meta.env.DEV ?
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