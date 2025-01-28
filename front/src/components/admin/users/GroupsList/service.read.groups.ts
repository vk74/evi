/**
 * @file service.read.groups.ts
 * Frontend service for fetching and managing groups list data.
 *
 * Functionality:
 * - Fetches groups list from the API endpoint.
 * - Updates the store cache with the received data.
 * - Handles errors and logging.
 * - Provides methods for fetching and caching groups data.
 */

import { api } from '@/core/api/service.axios'; // Axios instance
import { useStoreGroupsList } from './state.groups.list'; // Groups store
import { useUserStore } from '@/core/state/userstate'; // User store
import type { IGroupsResponse } from './types.groups.list'; // Types

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[GroupsService] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[GroupsService] ${message}`, meta || '')
};

/**
 * Service for working with the groups list
 */
export const groupsService = {
    /**
     * Fetches the list of all groups from the API and updates the store cache.
     * @returns Promise<void>
     * @throws {Error} If an error occurs during the fetch operation.
     */
    async fetchGroups(): Promise<void> {
        const store = useStoreGroupsList(); // Groups store
        const userStore = useUserStore(); // User store

        // Check if the user is authenticated
        if (!userStore.isLoggedIn) {
            const errorMessage = 'User not authenticated';
            logger.error(errorMessage);
            store.error = errorMessage;
            throw new Error(errorMessage);
        }

        // Check if the cache is already populated
        if (store.groups.length > 0) {
            logger.info('Using cached groups list from store', {
                cachedGroups: store.groups.length
            });
            return;
        }

        // Set loading state
        store.loading = true;
        store.error = null;

        try {
            logger.info('Cache empty, fetching groups list from API');

            // Fetch groups data from the API
            const response = await api.get<IGroupsResponse>('/api/admin/groups/fetch-groups');

            // Validate the response format
            if (!response.data || !Array.isArray(response.data.groups)) {
                const errorMessage = 'Invalid API response format';
                logger.error(errorMessage, { response: response.data });
                throw new Error(errorMessage);
            }

            logger.info('Successfully received groups data', {
                groupCount: response.data.groups.length
            });

            // Update the store cache with the new data
            store.updateCache(response.data.groups, response.data.total);

            logger.info('Groups list cached in store', {
                totalGroups: response.data.total
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process groups data';
            store.error = errorMessage;
            logger.error('Error fetching groups:', { error });
            throw new Error(errorMessage);
        } finally {
            // Reset loading state
            store.loading = false;
        }
    }
};

export default groupsService;