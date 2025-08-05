/**
 * version: 1.0.0
 * Cache for security validation patterns
 * 
 * This file provides caching functionality for compiled security patterns.
 * Backend file: cache.security.validation.ts
 */

import { SecurityPattern, CacheEntry } from './types.validation';
import { SECURITY_PATTERNS } from './rules.security';

// Cache for security patterns
const securityCache = new Map<string, CacheEntry<SecurityPattern>>();

/**
 * Get security rule from cache
 * @param patternName - Name of security pattern
 * @returns Cached security pattern or undefined if not found
 */
export function getSecurityRule(patternName: string): SecurityPattern | undefined {
  const cacheEntry = securityCache.get(patternName);
  if (cacheEntry) {
    return cacheEntry.value;
  }
  return undefined;
}

/**
 * Cache security rule
 * @param patternName - Name of security pattern
 * @param pattern - Security pattern to cache
 */
export function cacheSecurityRule(patternName: string, pattern: SecurityPattern): void {
  const cacheEntry: CacheEntry<SecurityPattern> = {
    key: patternName,
    value: pattern,
    timestamp: Date.now()
  };
  securityCache.set(patternName, cacheEntry);
}

/**
 * Clear security cache
 */
export function clearSecurityCache(): void {
  securityCache.clear();
  console.log('Security cache cleared');
}

/**
 * Get security cache statistics
 * @returns Object with cache statistics
 */
export function getSecurityCacheStats(): { size: number; entries: string[] } {
  return {
    size: securityCache.size,
    entries: Array.from(securityCache.keys())
  };
}

/**
 * Initialize security cache with all patterns
 */
export function initializeSecurityCache(): void {
  console.log('Initializing security cache...');
  
  // Clear existing cache
  clearSecurityCache();
  
  // Cache all security patterns
  SECURITY_PATTERNS.forEach(pattern => {
    cacheSecurityRule(pattern.name, pattern);
  });
  
  console.log(`Security cache initialized with ${SECURITY_PATTERNS.length} patterns`);
} 