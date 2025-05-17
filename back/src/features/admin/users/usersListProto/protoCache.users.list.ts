/**
 * @file protoCache.users.list.ts
 * Version: 1.0.0
 * Cache manager for prototype users list data with server-side processing.
 * 
 * Functionality:
 * - Maintains in-memory cache with parametrized keys
 * - Smart cache invalidation based on operation type
 * - Automatic TTL-based cleanup
 * - Size limit with LRU policy
 * - Cache statistics and monitoring
 */

import { IUsersResponse } from './protoTypes.users.list';

// Cache configuration
const CACHE_CONFIG = {
  TTL_MINUTES: 30,           // Entry lifetime in minutes
  MAX_ENTRIES: 600,          // Maximum number of cache entries
  CLEANUP_INTERVAL: 5 * 60,  // Cleanup interval in seconds
  ENABLE_LOGGING: true       // Detailed logging
};

// Cache key interface for typed parameters
export interface CacheKey {
  search: string;
  sortBy: string;
  sortDesc: boolean;
  page: number;
  limit: number;
}

// Interface for cache entry
interface CacheEntry {
  data: IUsersResponse;
  timestamp: number;
  accessCount: number;
}

// Create cache manager with closure to preserve state
const createUsersCache = () => {
  const cache = new Map<string, CacheEntry>();
  const keyLastAccess = new Map<string, number>();
  let cleanupInterval: NodeJS.Timeout;
  
  // Statistics for monitoring
  const stats = {
    hits: 0,
    misses: 0,
    fullInvalidations: 0,
    partialInvalidations: 0,
    refreshInvalidations: 0,
    expirations: 0
  };
  
  /**
   * Generates unique cache key from parameters
   */
  function generateKey(params: CacheKey): string {
    return `${params.search}-${params.sortBy}-${params.sortDesc}-${params.page}-${params.limit}`;
  }
  
  /**
   * Retrieves data from cache if available and not expired
   */
  function get(params: CacheKey): IUsersResponse | null {
    const key = generateKey(params);
    const entry = cache.get(key);
    
    if (!entry) {
      stats.misses++;
      CACHE_CONFIG.ENABLE_LOGGING && console.log(`[Proto UsersCache] Cache miss for key: ${key}`);
      return null;
    }
    
    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_CONFIG.TTL_MINUTES * 60 * 1000) {
      cache.delete(key);
      keyLastAccess.delete(key);
      CACHE_CONFIG.ENABLE_LOGGING && console.log(`[Proto UsersCache] Expired entry for key: ${key}`);
      stats.misses++;
      return null;
    }
    
    // Update access metadata for LRU
    entry.accessCount++;
    keyLastAccess.set(key, Date.now());
    stats.hits++;
    
    CACHE_CONFIG.ENABLE_LOGGING && console.log(`[Proto UsersCache] Cache hit for key: ${key}`);
    return entry.data;
  }
  
  /**
   * Removes least recently used entry when cache is full
   */
  function evictLRUEntry(): void {
    let oldestKey = '';
    let oldestTime = Infinity;
    
    for (const [k, time] of keyLastAccess.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = k;
      }
    }
    
    if (oldestKey) {
      cache.delete(oldestKey);
      keyLastAccess.delete(oldestKey);
      CACHE_CONFIG.ENABLE_LOGGING && console.log(`[Proto UsersCache] Evicted LRU entry with key: ${oldestKey}`);
    }
  }
  
  /**
   * Stores data in cache with a unique key
   */
  function set(params: CacheKey, data: IUsersResponse): void {
    const key = generateKey(params);
    
    // Enforce cache size limit
    if (cache.size >= CACHE_CONFIG.MAX_ENTRIES) {
      evictLRUEntry();
    }
    
    // Store new data
    cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 1
    });
    
    keyLastAccess.set(key, Date.now());
    CACHE_CONFIG.ENABLE_LOGGING && console.log(`[Proto UsersCache] Stored data for key: ${key}`);
  }
  
  /**
   * Invalidates cache entries based on operation type
   */
  function invalidate(type: 'all' | 'create' | 'update' | 'delete' | 'refresh', 
                     userId?: string, refreshParams?: CacheKey): void {
    switch (type) {
      case 'all':
        // Full cache clear
        cache.clear();
        keyLastAccess.clear();
        stats.fullInvalidations++;
        CACHE_CONFIG.ENABLE_LOGGING && console.log('[Proto UsersCache] Complete cache invalidation');
        break;
        
      case 'create':
        // Invalidate only non-filtered entries
        for (const [key] of cache.entries()) {
          const [search] = key.split('-');
          if (!search) {
            cache.delete(key);
            keyLastAccess.delete(key);
            stats.partialInvalidations++;
          }
        }
        CACHE_CONFIG.ENABLE_LOGGING && console.log('[Proto UsersCache] Invalidated non-filtered entries after user creation');
        break;
        
      case 'update':
      case 'delete':
        // Complete invalidation for simplicity on updates and deletes
        cache.clear();
        keyLastAccess.clear();
        stats.fullInvalidations++;
        CACHE_CONFIG.ENABLE_LOGGING && console.log(`[Proto UsersCache] Cache invalidated after user ${type} operation`);
        break;
        
      case 'refresh':
        if (refreshParams) {
          // For manual refresh - invalidate specific entry
          const refreshKey = generateKey(refreshParams);
          cache.delete(refreshKey);
          keyLastAccess.delete(refreshKey);
          stats.refreshInvalidations++;
          CACHE_CONFIG.ENABLE_LOGGING && console.log(`[Proto UsersCache] Refreshed cache for key: ${refreshKey}`);
        }
        break;
    }
  }
  
  /**
   * Sets up periodic cleanup for expired entries
   */
  function setupAutoCleanup(): void {
    cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > CACHE_CONFIG.TTL_MINUTES * 60 * 1000) {
          cache.delete(key);
          keyLastAccess.delete(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        CACHE_CONFIG.ENABLE_LOGGING && console.log(`[Proto UsersCache] Auto-cleanup: removed ${cleanedCount} expired entries`);
        stats.expirations += cleanedCount;
      }
    }, CACHE_CONFIG.CLEANUP_INTERVAL * 1000);
  }
  
  /**
   * Returns current cache statistics
   */
  function getStats() {
    return {
      hits: stats.hits,
      misses: stats.misses,
      fullInvalidations: stats.fullInvalidations,
      partialInvalidations: stats.partialInvalidations,
      refreshInvalidations: stats.refreshInvalidations,
      expirations: stats.expirations,
      size: cache.size,
      maxSize: CACHE_CONFIG.MAX_ENTRIES,
      hitRatio: stats.hits / (stats.hits + stats.misses || 1)
    };
  }
  
  // Initialize auto cleanup on startup
  setupAutoCleanup();
  
  return {
    get,
    set,
    invalidate,
    getStats,
    // Method for debugging and testing
    debugInfo: () => ({
      size: cache.size,
      keys: Array.from(cache.keys())
    })
  };
};

// Export singleton instance
export const usersProtoCache = createUsersCache();
