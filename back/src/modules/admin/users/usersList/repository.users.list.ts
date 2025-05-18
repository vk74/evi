/**
 * repository.users.list.ts - backend file
 * version: 1.0.01
 * 
 * Repository for caching users list data.
 * 
 * Functionality:
 * - Maintains in-memory cache for users list
 * - Implements cache invalidation with timer
 * - Provides methods to check, get, and set cache
 * - Supports manual invalidation of cache
 * 
 * Cache algorithm:
 * 1. Cache starts empty on service initialization
 * 2. First request triggers database query and caches result
 * 3. Cache is valid for 60 minutes from last update
 * 4. Timer resets on each new cache update
 * 5. After timer expires, cache is cleared and next request will query database
 * 6. Cache can be manually invalidated using refresh parameter
 */

import { IUsersResponse } from './types.users.list';

// Create a closure to store cache state and timer
const createUsersRepository = () => {
    let cache: IUsersResponse | null = null;
    let cacheTimer: NodeJS.Timeout | null = null;
    console.log('Users repository initialized with empty cache');

    return {
        // Check if cache has valid data
        hasValidCache: (): boolean => {
            return cache !== null;
        },

        // Get data from cache
        getCachedData: (): IUsersResponse => {
            if (!cache) {
                throw new Error('Users cache is empty');
            }
            return cache;
        },

        // Save data to cache and start timer
        setCacheData: (data: IUsersResponse): void => {
            console.log('Writing data to users list cache');
            cache = data;

            // Clear previous timer if exists
            if (cacheTimer) {
                clearTimeout(cacheTimer);
            }

            // Set new timer for 60 minutes
            cacheTimer = setTimeout(() => {
                console.log('Invalidating users list cache after timeout');
                cache = null;
                cacheTimer = null;
            }, 60 * 60 * 1000); // 60 minutes
        },

        // Manually invalidate cache (e.g., after users deletion)
        invalidateCache: (): void => {
            console.log('Manually invalidating users list cache');
            
            if (cache) {
                cache = null;
            }
            
            if (cacheTimer) {
                clearTimeout(cacheTimer);
                cacheTimer = null;
            }
        }
    };
};

// Export singleton instance
const usersRepository = createUsersRepository();
export default usersRepository;
