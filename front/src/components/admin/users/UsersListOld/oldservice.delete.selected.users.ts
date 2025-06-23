/**
 * @file service.delete.selected.users.ts
 * Version: 1.0.0
 * Frontend service for deleting selected users.
 *
 * Functionality:
 * - Sends delete requests to the API endpoint for selected users.
 * - Updates the store cache after successful deletion.
 * - Handles errors and logging.
 */

import { api } from '@/core/api/service.axios'; // Axios instance
import { useStoreUsersList } from './oldstate.users.list'; // Users store
import { useUserStore } from '@/core/state/userstate'; // User store

/**
 * Service for deleting selected users
 */
const deleteSelectedUsersService = {
    /**
     * Deletes selected users from the API and updates the store cache.
     * @param userIds - Array of user UUIDs to delete
     * @returns Promise<void>
     * @throws {Error} If an error occurs during the delete operation.
     */
    async deleteSelectedUsers(userIds: string[]): Promise<void> {
        const store = useStoreUsersList(); // Users store
        const userStore = useUserStore(); // User store

        // Check if the user is authenticated
        if (!userStore.isLoggedIn) {
            const errorMessage = 'User not authenticated';
            console.error('[DeleteUsersService]', errorMessage);
            store.setError(errorMessage);
            throw new Error(errorMessage);
        }

        // Check if there are any users to delete
        if (!userIds.length) {
            console.warn('[DeleteUsersService] No users selected for deletion');
            return;
        }

        try {
            // Set loading state
            store.setLoading(true);
            console.log(`[DeleteUsersService] Deleting ${userIds.length} users`);

            // Make API request to delete the users
            await api.post('/users/delete', { userIds });
            
            // Update store after successful deletion
            store.removeUsers(userIds);
            console.log(`[DeleteUsersService] Successfully deleted ${userIds.length} users`);
            
            // Clear any previous errors
            store.setError(null);
        } catch (error: any) {
            // Handle error
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            console.error('[DeleteUsersService] Error deleting users:', errorMessage);
            store.setError(`Error deleting users: ${errorMessage}`);
            throw error;
        } finally {
            // Reset loading state
            store.setLoading(false);
        }
    }
};

export default deleteSelectedUsersService;
