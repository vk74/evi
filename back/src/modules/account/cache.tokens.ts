/**
 * @file cache.tokens.ts
 * Version: 1.0.0
 * Cache manager for authentication tokens with server-side processing.
 * 
 * Functionality:
 * - Maintains in-memory cache of all active tokens
 * - Smart cache invalidation based on operation type
 * - Automatic TTL-based cleanup
 * - Size limit with LRU policy
 * - Cache statistics and monitoring
 * - Transactional operations with database
 */

import { TokenCacheEntry, TokenCacheKey } from './types.auth';

// Cache configuration
const CACHE_CONFIG = {
  TTL_MINUTES: 60 * 24 * 7 + 30,  // 7 days + 30 minutes (refresh token lifetime + buffer)
  MAX_ENTRIES: 1000000,            // Maximum number of cache entries (1 million)
  CLEANUP_INTERVAL: 20 * 60,       // Cleanup interval in seconds (20 minutes)
  ENABLE_LOGGING: true             // Detailed logging
};

// Interface for cache entry
interface CacheEntry {
  data: TokenCacheEntry;
  timestamp: number;
  accessCount: number;
}

// Create cache manager with closure to preserve state
const createTokensCache = () => {
  const cache = new Map<string, CacheEntry>();
  const keyLastAccess = new Map<string, number>();
  let cleanupInterval: NodeJS.Timeout;
  let isInitialized = false;
  
  // Statistics for monitoring
  const stats = {
    hits: 0,
    misses: 0,
    fullInvalidations: 0,
    partialInvalidations: 0,
    refreshInvalidations: 0,
    expirations: 0,
    initializations: 0
  };
  
  /**
   * Generates unique cache key from token hash
   */
  function generateKey(params: TokenCacheKey): string {
    return params.tokenHash;
  }
  
  /**
   * Retrieves token data from cache if available and not expired
   */
  function get(params: TokenCacheKey): TokenCacheEntry | null {
    const key = generateKey(params);
    const entry = cache.get(key);
    
    if (!entry) {
      stats.misses++;
      CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Cache miss for token hash: ${key.substring(0, 8)}...`);
      return null;
    }
    
    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_CONFIG.TTL_MINUTES * 60 * 1000) {
      cache.delete(key);
      keyLastAccess.delete(key);
      CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Expired entry for token hash: ${key.substring(0, 8)}...`);
      stats.misses++;
      return null;
    }
    
    // Check if token is revoked
    if (entry.data.revoked) {
      cache.delete(key);
      keyLastAccess.delete(key);
      CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Revoked token found in cache: ${key.substring(0, 8)}...`);
      stats.misses++;
      return null;
    }
    
    // Check if token is expired
    if (new Date() > entry.data.expiresAt) {
      cache.delete(key);
      keyLastAccess.delete(key);
      CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Expired token found in cache: ${key.substring(0, 8)}...`);
      stats.misses++;
      return null;
    }
    
    // Update access metadata for LRU
    entry.accessCount++;
    keyLastAccess.set(key, Date.now());
    stats.hits++;
    
    CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Cache hit for token hash: ${key.substring(0, 8)}...`);
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
      CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Evicted LRU entry with token hash: ${oldestKey.substring(0, 8)}...`);
    }
  }
  
  /**
   * Stores token data in cache with a unique key
   */
  function set(params: TokenCacheKey, data: TokenCacheEntry): void {
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
    CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Stored token data for hash: ${key.substring(0, 8)}...`);
  }
  
  /**
   * Removes token from cache
   */
  function remove(params: TokenCacheKey): void {
    const key = generateKey(params);
    const existed = cache.has(key);
    
    if (existed) {
      cache.delete(key);
      keyLastAccess.delete(key);
      CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Removed token from cache: ${key.substring(0, 8)}...`);
    }
  }
  
  /**
   * Invalidates cache entries based on operation type
   */
  function invalidate(type: 'all' | 'login' | 'refresh' | 'logout' | 'revoke', 
                     userUuid?: string, tokenHash?: string): void {
    switch (type) {
      case 'all':
        // Full cache clear
        cache.clear();
        keyLastAccess.clear();
        stats.fullInvalidations++;
        CACHE_CONFIG.ENABLE_LOGGING && console.log('[TokensCache] Complete cache invalidation');
        break;
        
      case 'login':
        // No invalidation needed for login - new tokens are added
        CACHE_CONFIG.ENABLE_LOGGING && console.log('[TokensCache] Login operation - no cache invalidation needed');
        break;
        
      case 'refresh':
        if (tokenHash) {
          // For refresh - remove old token and add new one
          const refreshKey = generateKey({ tokenHash });
          cache.delete(refreshKey);
          keyLastAccess.delete(refreshKey);
          stats.refreshInvalidations++;
          CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Refreshed cache for token: ${refreshKey.substring(0, 8)}...`);
        }
        break;
        
      case 'logout':
      case 'revoke':
        if (tokenHash) {
          // Remove specific token
          const logoutKey = generateKey({ tokenHash });
          cache.delete(logoutKey);
          keyLastAccess.delete(logoutKey);
          CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Removed token from cache: ${logoutKey.substring(0, 8)}...`);
        } else if (userUuid) {
          // Remove all tokens for user
          let removedCount = 0;
          for (const [key, entry] of cache.entries()) {
            if (entry.data.userUuid === userUuid) {
              cache.delete(key);
              keyLastAccess.delete(key);
              removedCount++;
            }
          }
          CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Removed ${removedCount} tokens for user: ${userUuid}`);
        }
        break;
    }
  }
  
  /**
   * Initializes cache with data from database
   */
  async function initializeCache(dbTokens: TokenCacheEntry[]): Promise<void> {
    if (isInitialized) {
      CACHE_CONFIG.ENABLE_LOGGING && console.log('[TokensCache] Cache already initialized, skipping...');
      return;
    }
    
    console.log(`[TokensCache] Initializing cache with ${dbTokens.length} tokens...`);
    
    // Clear existing cache
    cache.clear();
    keyLastAccess.clear();
    
    // Add all active tokens from database
    for (const token of dbTokens) {
      if (!token.revoked && new Date() < token.expiresAt) {
        const key = generateKey({ tokenHash: token.tokenHash });
        cache.set(key, {
          data: token,
          timestamp: Date.now(),
          accessCount: 1
        });
        keyLastAccess.set(key, Date.now());
      }
    }
    
    isInitialized = true;
    stats.initializations++;
    console.log(`[TokensCache] Cache initialized with ${cache.size} active tokens`);
  }
  
  /**
   * Sets up periodic cleanup for expired entries
   */
  function setupAutoCleanup(): void {
    cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, entry] of cache.entries()) {
        // Check TTL
        if (now - entry.timestamp > CACHE_CONFIG.TTL_MINUTES * 60 * 1000) {
          cache.delete(key);
          keyLastAccess.delete(key);
          cleanedCount++;
          continue;
        }
        
        // Check token expiration
        if (new Date() > entry.data.expiresAt) {
          cache.delete(key);
          keyLastAccess.delete(key);
          cleanedCount++;
          continue;
        }
        
        // Check if token is revoked
        if (entry.data.revoked) {
          cache.delete(key);
          keyLastAccess.delete(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        CACHE_CONFIG.ENABLE_LOGGING && console.log(`[TokensCache] Auto-cleanup: removed ${cleanedCount} expired/revoked entries`);
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
      initializations: stats.initializations,
      size: cache.size,
      maxSize: CACHE_CONFIG.MAX_ENTRIES,
      hitRatio: stats.hits / (stats.hits + stats.misses || 1),
      isInitialized
    };
  }
  
  /**
   * Cleans up resources (stops intervals, clears cache)
   */
  function cleanup(): void {
    if (cleanupInterval) {
      clearInterval(cleanupInterval);
    }
    cache.clear();
    keyLastAccess.clear();
    isInitialized = false;
  }
  
  // Initialize auto cleanup on startup
  setupAutoCleanup();
  
  return {
    get,
    set,
    remove,
    invalidate,
    initializeCache,
    getStats,
    cleanup,
    // Method for debugging and testing
    debugInfo: () => ({
      size: cache.size,
      keys: Array.from(cache.keys()).map(k => k.substring(0, 8) + '...'),
      isInitialized
    })
  };
};

// Export singleton instance
export const tokensCache = createTokensCache(); 