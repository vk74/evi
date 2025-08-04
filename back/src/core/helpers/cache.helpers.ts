/**
 * @file cache.helpers.t * @version 1.0.0
 * @description BACKEND Cache service for helpers
 * @filename cache.helpers.ts
 * @created 2024-01-01
 * @updated 2024-12-19
 *
 * Functionality:
 * - Provides caching capabilities for helpers to reduce database load
 * - Implements key-value storage with TTL (time-to-live)
 * - Supports different cache types with prefixes
 * - Includes size limits and LRU eviction policy
 * - Tracks and logs cache statistics
 */

import { createAndPublishEvent } from '../eventBus/fabric.events';
import { CACHE_HELPER_EVENTS, CACHE_OPERATION_EVENTS } from './events.helpers';
import { Request } from 'express';



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
export async function initCache(req?: Request): Promise<void> {
  // Publish cache initialization event
  await createAndPublishEvent({
    eventName: CACHE_HELPER_EVENTS.INIT_SUCCESS.eventName,
    payload: {
      cacheTypes: Object.keys(cacheStorage),
      config: cacheConfig
    },
    req
  });

  // Set up periodic stats logging (every 10 minutes)
  setInterval(async () => {
    await logStats(req);
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
 * @param req Express request object for event context
 * @returns The cached value or undefined if not found or expired
 */
export async function get<T>(key: string, req?: Request): Promise<T | undefined> {
  const parsedKey = parseKey(key);
  
  if (!parsedKey) {
    await createAndPublishEvent({
      eventName: CACHE_OPERATION_EVENTS.GET_INVALID_KEY.eventName,
      payload: { key },
      req
    });
    return undefined;
  }
  
  const { type, id } = parsedKey;
  const cache = cacheStorage[type];
  const entry = cache.get(id);
  
  // If entry doesn't exist
  if (!entry) {
    cacheStats[type].misses++;
    await createAndPublishEvent({
      eventName: CACHE_OPERATION_EVENTS.GET_MISS.eventName,
      payload: { key, type, id },
      req
    });
    return undefined;
  }
  
  const now = Date.now();
  
  // If entry has expired
  if (entry.expiry < now) {
    cache.delete(id);
    cacheStats[type].misses++;
    cacheStats[type].size--;
    
    await createAndPublishEvent({
      eventName: CACHE_OPERATION_EVENTS.GET_EXPIRED.eventName,
      payload: { key, type, id, expiredAt: new Date(entry.expiry) },
      req
    });
    return undefined;
  }
  
  // Update last accessed time
  entry.lastAccessed = now;
  cacheStats[type].hits++;
  
  await createAndPublishEvent({
    eventName: CACHE_OPERATION_EVENTS.GET_HIT.eventName,
    payload: { key, type, id },
    req
  });
  
  return entry.value;
}

/**
 * Set value in cache
 * @param key The cache key with type prefix
 * @param value The value to store
 * @param req Express request object for event context
 */
export async function set<T>(key: string, value: T, req?: Request): Promise<void> {
  const parsedKey = parseKey(key);
  
  if (!parsedKey) {
    await createAndPublishEvent({
      eventName: CACHE_OPERATION_EVENTS.SET_INVALID_KEY.eventName,
      payload: { key, value },
      req
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
      
      await createAndPublishEvent({
        eventName: CACHE_OPERATION_EVENTS.SET_EVICT.eventName,
        payload: { type, key: oldestKey, lastAccessed: new Date(oldestTime) },
        req
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
  
  await createAndPublishEvent({
    eventName: CACHE_OPERATION_EVENTS.SET_SUCCESS.eventName,
    payload: {
      key,
      type,
      id,
      expiresAt: new Date(entry.expiry),
      isUpdate
    },
    req
  });
}

/**
 * Delete entry from cache
 * @param key The cache key with type prefix
 * @param req Express request object for event context
 */
export async function del(key: string, req?: Request): Promise<void> {
  const parsedKey = parseKey(key);
  
  if (!parsedKey) {
    await createAndPublishEvent({
      eventName: CACHE_OPERATION_EVENTS.DELETE_INVALID_KEY.eventName,
      payload: { key },
      req
    });
    return;
  }
  
  const { type, id } = parsedKey;
  const cache = cacheStorage[type];
  
  if (cache.delete(id)) {
    cacheStats[type].size--;
    
    await createAndPublishEvent({
      eventName: CACHE_OPERATION_EVENTS.DELETE_SUCCESS.eventName,
      payload: { key, type, id },
      req
    });
  } else {
    await createAndPublishEvent({
      eventName: CACHE_OPERATION_EVENTS.DELETE_NOT_FOUND.eventName,
      payload: { key, type, id },
      req
    });
  }
}

/**
 * Clear all entries for a specific cache type
 * @param type The cache type prefix
 * @param req Express request object for event context
 */
export async function clearByType(type: string, req?: Request): Promise<void> {
  if (!cacheStorage[type]) {
    await createAndPublishEvent({
      eventName: CACHE_OPERATION_EVENTS.CLEAR_TYPE_NOT_FOUND.eventName,
      payload: { type },
      req
    });
    return;
  }
  
  const cache = cacheStorage[type];
  const entriesCount = cache.size;
  
  cache.clear();
  cacheStats[type] = { hits: 0, misses: 0, size: 0 };
  
  await createAndPublishEvent({
    eventName: CACHE_OPERATION_EVENTS.CLEAR_TYPE.eventName,
    payload: { type, entriesCount },
    req
  });
}

/**
 * Clear all cache entries from all types
 * @param req Express request object for event context
 */
export async function clearAll(req?: Request): Promise<void> {
  for (const type of Object.values(CACHE_TYPES)) {
    await clearByType(type, req);
  }
  
  await createAndPublishEvent({
    eventName: CACHE_OPERATION_EVENTS.CLEAR_ALL.eventName,
    payload: { types: Object.values(CACHE_TYPES) },
    req
  });
}

/**
 * Log cache statistics
 * @param req Express request object for event context
 */
async function logStats(req?: Request): Promise<void> {
  const stats = Object.entries(cacheStats).map(([type, stat]) => ({ type, ...stat }));
  
  // Publish cache statistics event
  await createAndPublishEvent({
    eventName: CACHE_HELPER_EVENTS.STATS_REPORT.eventName,
    payload: { stats },
    req
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