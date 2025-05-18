/**
 * @file service.read.users.ts
 * Version: 1.0.0
 * Frontend service for fetching and managing users list data.
 *
 * Functionality:
 * - Fetches users list from the API endpoint.
 * - Updates the store cache with the received data.
 * - Handles errors and logging.
 * - Provides methods for fetching and caching users data.
 */

import { api } from '@/core/api/service.axios'; // Axios instance
import { useStoreUsersList } from './state.users.list'; // Users store
import { useUserStore } from '@/core/state/userstate'; // User store
import type { IUsersResponse } from './types.users.list'; // Types

/**
 * Service for working with the users list
 */
const usersService = {
    /**
     * Fetches the list of all users from the API and updates the store cache.
     * @returns Promise<void>
     * @throws {Error} If an error occurs during the fetch operation.
     */
    async fetchUsers(): Promise<void> {
        const store = useStoreUsersList(); // Users store
        const userStore = useUserStore(); // User store

        // Check if the user is authenticated
        if (!userStore.isLoggedIn) {
            const errorMessage = 'User not authenticated';
            console.error('[UsersService]', errorMessage);
            store.setError(errorMessage);
            throw new Error(errorMessage);
        }

        try {
            // Set loading state
            store.setLoading(true);
            console.log('[UsersService] Fetching users data');

            // Make API request to get all users
            const response = await api.get<IUsersResponse>('/users/list');
            
            // Update store with fetched data
            const users = response.data.items;
            console.log(`[UsersService] Fetched ${users.length} users`);
            store.setUsers(users);
            
            // Clear any previous errors
            store.setError(null);
        } catch (error: any) {
            // Handle error
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            console.error('[UsersService] Error fetching users:', errorMessage);
            store.setError(`Error fetching users: ${errorMessage}`);
            throw error;
        } finally {
            // Reset loading state
            store.setLoading(false);
        }
    },

    /**
     * Refreshes the user data in the store
     * @returns Promise<void>
     */
    async refreshUsers(): Promise<void> {
        const store = useStoreUsersList();
        // Clear the current cache first
        store.clearCache();
        // Fetch fresh data
        await this.fetchUsers();
    }
};

export default usersService;
