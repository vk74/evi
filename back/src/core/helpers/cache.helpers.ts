/**
 * @file cache.helpers.ts
 * BACKEND Cache service for helpers
 *
 * Functionality:
 * - Provides caching capabilities for helpers to reduce database load
 * - Implements key-value storage with TTL (time-to-live)
 * - Supports different cache types with prefixes
 * - Includes size limits and LRU eviction policy
 * - Tracks and logs cache statistics
 */

import { createSystemLgr, Lgr } from '../lgr/lgr.index';
import { Events } from '../lgr/codes';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { CACHE_HELPER_EVENTS } from './events.helpers';

// Create lgr for cache
const lgr: Lgr = createSystemLgr({
  module: 'HelpersCacheService',
  fileName: 'cache.helpers.ts'
});

// Interface for cache entry
interface CacheEntry<T> {
  value: T;
  expiry: number; // Timestamp when entry expires
  lastAccessed: number; // Timestamp of last access (for LRU)
}

// Interface for cache options
interface CacheTypeConfig {
  ttl: number; // Time to live in milliseconds
  limit: number; // Maximum number of entries
}

// Interface for cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

// Cache type prefixes
const CACHE_TYPES = {
  GROUP_UUID: 'group:uuid:',
  GROUP_NAME: 'group:name:',
  USER_STATUS: 'user:status:',
  USER_ADMIN: 'user:admin:',
  USER_NAME: 'user:name:'
};

// Cache configuration for each type
const cacheConfig: Record<string, CacheTypeConfig> = {
  [CACHE_TYPES.GROUP_UUID]: { ttl: 15 * 60 * 1000, limit: 1000 }, // 15 minutes for group UUIDs
  [CACHE_TYPES.GROUP_NAME]: { ttl: 30 * 60 * 1000, limit: 1000 }, // 30 minutes for group names
  [CACHE_TYPES.USER_STATUS]: { ttl: 5 * 60 * 1000, limit: 5000 }, // 5 minutes for user statuses
  [CACHE_TYPES.USER_ADMIN]: { ttl: 10 * 60 * 1000, limit: 2000 }, // 10 minutes for admin checks
  [CACHE_TYPES.USER_NAME]: { ttl: 30 * 60 * 1000, limit: 5000 }   // 30 minutes for usernames
};

// Cache storage organized by type
const cacheStorage: Record<string, Map<string, CacheEntry<any>>> = {
  [CACHE_TYPES.GROUP_UUID]: new Map(),
  [CACHE_TYPES.GROUP_NAME]: new Map(),
  [CACHE_TYPES.USER_STATUS]: new Map(),
  [CACHE_TYPES.USER_ADMIN]: new Map(),
  [CACHE_TYPES.USER_NAME]: new Map()
};

// Cache statistics
const cacheStats: Record<string, CacheStats> = {
  [CACHE_TYPES.GROUP_UUID]: { hits: 0, misses: 0, size: 0 },
  [CACHE_TYPES.GROUP_NAME]: { hits: 0, misses: 0, size: 0 },
  [CACHE_TYPES.USER_STATUS]: { hits: 0, misses: 0, size: 0 },
  [CACHE_TYPES.USER_ADMIN]: { hits: 0, misses: 0, size: 0 },
  [CACHE_TYPES.USER_NAME]: { hits: 0, misses: 0, size: 0 }
};

// Initialize the cache and start periodic stats logging
export function initCache(): void {
  // Publish cache initialization event
  createAndPublishEvent({
    eventName: CACHE_HELPER_EVENTS.INIT_SUCCESS.eventName,
    payload: {
      cacheTypes: Object.keys(cacheStorage),
      config: cacheConfig
    }
  });

  // Set up periodic stats logging (every 10 minutes)
  setInterval(() => {
    logStats();
  }, 10 * 60 * 1000);
}

/**
 * Parse key to extract type prefix and ID
 * @param key The cache key with prefix
 * @returns Object with type and id
 */
function parseKey(key: string): { type: string; id: string } | null {
  // Find which cache type this key belongs to
  for (const type of Object.values(CACHE_TYPES)) {
    if (key.startsWith(type)) {
      return {
        type,
        id: key.substring(type.length)
      };
    }
  }
  return null;
}

/**
 * Get value from cache
 * @param key The cache key with type prefix
 * @returns The cached value or undefined if not found or expired
 */
export function get<T>(key: string): T | undefined {
  const parsedKey = parseKey(key);
  
  if (!parsedKey) {
    lgr.debug({
      code: Events.CORE.HELPERS.CACHE.GET.INVALID_KEY.code,
      message: `Invalid cache key format: ${key}`,
      details: { key }
    });
    return undefined;
  }
  
  const { type, id } = parsedKey;
  const cache = cacheStorage[type];
  const entry = cache.get(id);
  
  // If entry doesn't exist
  if (!entry) {
    cacheStats[type].misses++;
    lgr.debug({
      code: Events.CORE.HELPERS.CACHE.GET.MISS.code,
      message: `Cache miss for key: ${key}`,
      details: { key, type, id }
    });
    return undefined;
  }
  
  const now = Date.now();
  
  // If entry has expired
  if (entry.expiry < now) {
    cache.delete(id);
    cacheStats[type].misses++;
    cacheStats[type].size--;
    
    lgr.debug({
      code: Events.CORE.HELPERS.CACHE.GET.EXPIRED.code,
      message: `Cache entry expired for key: ${key}`,
      details: { key, type, id, expiredAt: new Date(entry.expiry) }
    });
    return undefined;
  }
  
  // Update last accessed time
  entry.lastAccessed = now;
  cacheStats[type].hits++;
  
  lgr.debug({
    code: Events.CORE.HELPERS.CACHE.GET.HIT.code,
    message: `Cache hit for key: ${key}`,
    details: { key, type, id }
  });
  
  return entry.value;
}

/**
 * Set value in cache
 * @param key The cache key with type prefix
 * @param value The value to store
 */
export function set<T>(key: string, value: T): void {
  const parsedKey = parseKey(key);
  
  if (!parsedKey) {
    lgr.debug({
      code: Events.CORE.HELPERS.CACHE.SET.INVALID_KEY.code,
      message: `Invalid cache key format: ${key}`,
      details: { key, value }
    });
    return;
  }
  
  const { type, id } = parsedKey;
  const cache = cacheStorage[type];
  const config = cacheConfig[type];
  const now = Date.now();
  
  // Apply LRU eviction policy if cache is full
  if (cache.size >= config.limit && !cache.has(id)) {
    // Find the least recently used entry
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [entryKey, entry] of cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = entryKey;
      }
    }
    
    // Evict the oldest entry
    if (oldestKey !== null) {
      cache.delete(oldestKey);
      cacheStats[type].size--;
      
      lgr.debug({
        code: Events.CORE.HELPERS.CACHE.SET.EVICT.code,
        message: `Evicted LRU cache entry: ${type}${oldestKey}`,
        details: { type, key: oldestKey, lastAccessed: new Date(oldestTime) }
      });
    }
  }
  
  // Add or update the entry
  const entry: CacheEntry<T> = {
    value,
    expiry: now + config.ttl,
    lastAccessed: now
  };
  
  const isUpdate = cache.has(id);
  cache.set(id, entry);
  
  if (!isUpdate) {
    cacheStats[type].size++;
  }
  
  lgr.debug({
    code: Events.CORE.HELPERS.CACHE.SET.SUCCESS.code,
    message: `Cache ${isUpdate ? 'updated' : 'set'} for key: ${key}`,
    details: {
      key,
      type,
      id,
      expiresAt: new Date(entry.expiry),
      isUpdate
    }
  });
}

/**
 * Delete entry from cache
 * @param key The cache key with type prefix
 */
export function del(key: string): void {
  const parsedKey = parseKey(key);
  
  if (!parsedKey) {
    lgr.debug({
      code: Events.CORE.HELPERS.CACHE.DELETE.INVALID_KEY.code,
      message: `Invalid cache key format: ${key}`,
      details: { key }
    });
    return;
  }
  
  const { type, id } = parsedKey;
  const cache = cacheStorage[type];
  
  if (cache.delete(id)) {
    cacheStats[type].size--;
    
    lgr.debug({
      code: Events.CORE.HELPERS.CACHE.DELETE.SUCCESS.code,
      message: `Cache entry deleted for key: ${key}`,
      details: { key, type, id }
    });
  } else {
    lgr.debug({
      code: Events.CORE.HELPERS.CACHE.DELETE.NOT_FOUND.code,
      message: `Cache entry not found for deletion: ${key}`,
      details: { key, type, id }
    });
  }
}

/**
 * Clear all entries for a specific cache type
 * @param type The cache type prefix
 */
export function clearByType(type: string): void {
  if (!cacheStorage[type]) {
    lgr.warn({
      code: Events.CORE.HELPERS.CACHE.CLEAR.TYPE_NOT_FOUND.code,
      message: `Cache type not found for clearing: ${type}`,
      details: { type }
    });
    return;
  }
  
  const cache = cacheStorage[type];
  const entriesCount = cache.size;
  
  cache.clear();
  cacheStats[type] = { hits: 0, misses: 0, size: 0 };
  
  lgr.info({
    code: Events.CORE.HELPERS.CACHE.CLEAR.TYPE.code,
    message: `Cleared all cache entries for type: ${type}`,
    details: { type, entriesCount }
  });
}

/**
 * Clear all cache entries from all types
 */
export function clearAll(): void {
  for (const type of Object.values(CACHE_TYPES)) {
    clearByType(type);
  }
  
  lgr.info({
    code: Events.CORE.HELPERS.CACHE.CLEAR.ALL.code,
    message: 'Cleared all cache entries from all types'
  });
}

/**
 * Log cache statistics
 */
function logStats(): void {
  const stats = Object.entries(cacheStats).map(([type, stat]) => ({ type, ...stat }));
  
  // Publish cache statistics event
  createAndPublishEvent({
    eventName: CACHE_HELPER_EVENTS.STATS_REPORT.eventName,
    payload: { stats }
  });
}

// Helper functions for constructing cache keys
export const CacheKeys = {
  forGroupUuid: (groupName: string): string => `${CACHE_TYPES.GROUP_UUID}${groupName}`,
  forGroupName: (uuid: string): string => `${CACHE_TYPES.GROUP_NAME}${uuid}`,
  forUserStatus: (uuid: string): string => `${CACHE_TYPES.USER_STATUS}${uuid}`,
  forUserAdmin: (uuid: string): string => `${CACHE_TYPES.USER_ADMIN}${uuid}`,
  forUserName: (uuid: string): string => `${CACHE_TYPES.USER_NAME}${uuid}`
};

// Export CACHE_TYPES for use in other modules
export { CACHE_TYPES };