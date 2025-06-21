/**
 * protoState.users.list.ts
 * Version: 1.0.01
 * Pinia store for managing users list state with optimized caching.
 * 
 * Functionality:
 * - Parametrized caching system for users data
 * - Cache management with TTL and LRU policy
 * - Display parameters management (pagination, sorting, search)
 * - Selection state for multi-select operations
 * - Server-side pagination support with proper total count handling
 * 
 * Used by:
 * - protoUsersList.vue component
 * - protoService.fetch.users.ts service
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from '@/core/state/userstate'
import { 
    IUser, 
    ItemsPerPageOption,
    ISortParams,
    ISearchParams,
    IFetchUsersParams,
    CacheEntry,
    IPaginationParams,
    CacheStats
} from './protoTypes.users.list'

// Configuration
const CACHE_CONFIG = {
    TTL_MINUTES: 60,        // Cache entry lifetime in minutes
    MAX_ENTRIES: 50,        // Maximum number of cache entries
    AUTO_CLEANUP_MINS: 15   // Auto cleanup interval in minutes
};

// Logger for main operations
const logger = {
    info: (message: string, meta?: any) => console.log(`[UsersStore] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[UsersStore] ${message}`, meta || '')
};

export const useStoreUsersList = defineStore('protoViewAllUsers', () => {
    // User store for auth state
    const userStore = useUserStore();
    
    // Cache and statistics
    const cacheMap = ref<Record<string, CacheEntry>>({});
    const cacheStats = ref<CacheStats>({
        size: 0,
        hits: 0,
        misses: 0,
        hitRatio: 0
    });
    
    // Current display parameters
    const displayParams = ref<IFetchUsersParams>({
        page: 1,
        itemsPerPage: 25 as ItemsPerPageOption,
        sortBy: '',
        sortDesc: false,
        search: ''
    });
    
    // UI state
    const loading = ref(false);
    const error = ref<string | null>(null);
    const selectedUsers = ref<string[]>([]);
    
    // Result data
    const currentUsers = ref<IUser[]>([]);
    const totalItems = ref(0);
    
    // Cache cleanup timer
    let cleanupTimer: ReturnType<typeof setTimeout> | null = null;
    
    /**
     * Generates cache key from query parameters
     */
    function generateCacheKey(params: IFetchUsersParams): string {
        return `${params.search}-${params.sortBy}-${params.sortDesc}-${params.page}-${params.itemsPerPage}`;
    }
    
    /**
     * Checks if cache entry is still valid
     */
    function isCacheValid(entry: CacheEntry): boolean {
        const now = Date.now();
        const ageInMinutes = (now - entry.timestamp) / (1000 * 60);
        return ageInMinutes <= CACHE_CONFIG.TTL_MINUTES;
    }
    
    /**
     * Gets data from cache if available and valid
     */
    function getCachedData(params: IFetchUsersParams): CacheEntry | null {
        const key = generateCacheKey(params);
        const entry = cacheMap.value[key];
        
        if (!entry) {
            cacheStats.value.misses++;
            logger.info(`Cache miss for key: ${key}`);
            return null;
        }
        
        if (!isCacheValid(entry)) {
            // Remove expired entry
            delete cacheMap.value[key];
            cacheStats.value.misses++;
            logger.info(`Cache expired for key: ${key}`);
            return null;
        }
        
        cacheStats.value.hits++;
        cacheStats.value.hitRatio = cacheStats.value.hits / (cacheStats.value.hits + cacheStats.value.misses);
        logger.info(`Cache hit for key: ${key}`);
        return entry;
    }
    
    /**
     * Saves data to cache
     */
    function setCacheData(params: IFetchUsersParams, users: IUser[], total: number): void {
        const key = generateCacheKey(params);
        
        // Check if we need to evict entries (simple LRU implementation)
        if (Object.keys(cacheMap.value).length >= CACHE_CONFIG.MAX_ENTRIES) {
            const oldestKey = Object.keys(cacheMap.value).reduce((oldest, key) => {
                if (!oldest) return key;
                return cacheMap.value[key].timestamp < cacheMap.value[oldest].timestamp ? key : oldest;
            }, '');
            
            if (oldestKey) {
                delete cacheMap.value[oldestKey];
                logger.info(`Evicted oldest cache entry: ${oldestKey}`);
            }
        }
        
        // Store new data
        cacheMap.value[key] = {
            users: [...users],
            totalItems: total,
            timestamp: Date.now(),
            query: { ...params }
        };
        
        cacheStats.value.size = Object.keys(cacheMap.value).length;
        logger.info(`Cached data for key: ${key}`, { usersCount: users.length, total });
    }
    
    /**
     * Sets up automatic cache cleanup
     */
    function setupCacheCleanup() {
        if (cleanupTimer) {
            clearInterval(cleanupTimer);
        }
        
        cleanupTimer = setInterval(() => {
            const now = Date.now();
            let removedCount = 0;
            
            Object.keys(cacheMap.value).forEach(key => {
                const entry = cacheMap.value[key];
                const ageInMinutes = (now - entry.timestamp) / (1000 * 60);
                
                if (ageInMinutes > CACHE_CONFIG.TTL_MINUTES) {
                    delete cacheMap.value[key];
                    removedCount++;
                }
            });
            
            if (removedCount > 0) {
                cacheStats.value.size = Object.keys(cacheMap.value).length;
                logger.info(`Cleaned up ${removedCount} expired cache entries`);
            }
        }, CACHE_CONFIG.AUTO_CLEANUP_MINS * 60 * 1000);
    }
    
    /**
     * Invalidates all or specific cache entries
     */
    function invalidateCache(specificParams?: IFetchUsersParams): void {
        if (specificParams) {
            const key = generateCacheKey(specificParams);
            if (cacheMap.value[key]) {
                delete cacheMap.value[key];
                logger.info(`Invalidated specific cache entry: ${key}`);
            }
        } else {
            cacheMap.value = {};
            logger.info('Complete cache invalidation');
        }
        
        cacheStats.value.size = Object.keys(cacheMap.value).length;
    }
    
    /**
     * Updates current display parameters
     */
    function updateDisplayParams(params: Partial<IFetchUsersParams>): void {
        displayParams.value = {
            ...displayParams.value,
            ...params
        };
        
        // Reset to first page when changing sort or search
        if ('sortBy' in params || 'sortDesc' in params || 'search' in params) {
            displayParams.value.page = 1;
        }
        
        logger.info('Display parameters updated', displayParams.value);
    }
    
    /**
     * Sets current users and total count from API response
     * @param users - Array of user records for current page
     * @param total - Total number of users in database (not just current page)
     */
    function setUsersData(users: IUser[], total: number): void {
        console.log('[UsersStore] setUsersData called with:', {
            usersCount: users.length,
            total: total,
            usersSample: users.slice(0, 2).map(u => ({ id: u.user_id, username: u.username }))
        });
        
        currentUsers.value = users;
        totalItems.value = total; // This should be the total count from database, not current page count
        
        console.log('[UsersStore] State updated:', {
            currentUsersLength: currentUsers.value.length,
            totalItemsValue: totalItems.value
        });
        
        logger.info('Users data updated', { 
            currentPageUsers: users.length, 
            totalItemsInDatabase: total 
        });
    }
    
    /**
     * Selection management
     */
    function selectUser(userId: string): void {
        if (!selectedUsers.value.includes(userId)) {
            selectedUsers.value.push(userId);
            logger.info(`User ${userId} selected`);
        }
    }
    
    function deselectUser(userId: string): void {
        selectedUsers.value = selectedUsers.value.filter(id => id !== userId);
        logger.info(`User ${userId} deselected`);
    }
    
    function clearSelection(): void {
        selectedUsers.value = [];
        logger.info('Selection cleared');
    }
    
    /**
     * Check if current user is authorized
     */
    const isAuthorized = computed(() => userStore.isLoggedIn);
    
    /**
     * Number of selected users
     */
    const selectedCount = computed(() => selectedUsers.value.length);
    
    /**
     * Flag indicating if at least one user is selected
     */
    const hasSelected = computed(() => selectedCount.value > 0);
    
    /**
     * Flag indicating if exactly one user is selected
     */
    const hasOneSelected = computed(() => selectedCount.value === 1);
    
    // Setup cache cleanup on store initialization
    setupCacheCleanup();
    
    return {
        // State
        loading,
        error,
        currentUsers,
        totalItems,
        displayParams,
        selectedUsers,
        cacheStats,
        
        // Display parameter getters
        get page() { return displayParams.value.page },
        get itemsPerPage() { return displayParams.value.itemsPerPage },
        get sortBy() { return displayParams.value.sortBy },
        get sortDesc() { return displayParams.value.sortDesc },
        get search() { return displayParams.value.search },
        
        // Getters
        isAuthorized,
        selectedCount,
        hasSelected,
        hasOneSelected,
        
        // Cache methods
        getCachedData,
        setCacheData,
        invalidateCache,
        
        // Data methods
        setUsersData,
        updateDisplayParams,
        
        // Selection methods
        selectUser,
        deselectUser,
        clearSelection,
        isSelected: (userId: string) => selectedUsers.value.includes(userId)
    };
});
