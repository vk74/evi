/**
 * @file service.fetch.users.ts
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
import { useStoreUsersList } from './oldstate.users.list'; // Users store
import { useUserStore } from '@/core/state/userstate'; // User store
import type { IUsersResponse } from './oldtypes.users.list'; // Types

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
            const total = response.data.total;
            console.log(`[UsersService] Fetched ${users.length} users, total: ${total}`);
            store.setUsers(users, total);
            
            // Clear any previous errors
            store.setError(null);
        } catch (error: unknown) {
            // Handle error
            let errorMessage = 'Unknown error';
            
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null) {
                const errorObj = error as { response?: { data?: { message?: string } }, message?: string };
                errorMessage = errorObj.response?.data?.message || errorObj.message || errorMessage;
            }
            
            console.error('[UsersService] Error fetching users:', errorMessage);
            store.setError(`Error fetching users: ${errorMessage}`);
            throw error;
        } finally {
            // Reset loading state
            store.setLoading(false);
        }
    },

    /**
     * Refreshes the user data in the store and backend cache
     * @returns Promise<void>
     */
    async refreshUsers(): Promise<void> {
        const store = useStoreUsersList();
        // Clear the current cache first
        store.clearCache();
        
        try {
            // Set loading state
            store.setLoading(true);
            console.log('[UsersService] Refreshing users data...');

            // Make API request with refresh parameter to clear backend cache
            const response = await api.get<IUsersResponse>('/users/list', {
                params: { refresh: true }
            });
            
            // Update store with fresh data
            const users = response.data.items;
            const total = response.data.total;
            console.log(`[UsersService] Refreshed data with ${users.length} users, total: ${total}`);
            store.setUsers(users, total);
            
            // Clear any previous errors
            store.setError(null);
        } catch (error: unknown) {
            // Handle error
            let errorMessage = 'Unknown error';
            
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null) {
                const errorObj = error as { response?: { data?: { message?: string } }, message?: string };
                errorMessage = errorObj.response?.data?.message || errorObj.message || errorMessage;
            }
            
            console.error('[UsersService] Error refreshing users:', errorMessage);
            store.setError(`Error refreshing users: ${errorMessage}`);
            throw error;
        } finally {
            // Reset loading state
            store.setLoading(false);
        }
    }
};

export default usersService;
