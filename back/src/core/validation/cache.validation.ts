/**
 * version: 1.0.0
 * Cache for validation rules
 * 
 * This file provides caching functionality for compiled validation rules.
 * Backend file: cache.validation.ts
 */

import { ValidationRule, CacheEntry } from './types.validation';
import { VALIDATION_RULES } from './rules.validation';

// Cache for validation rules
const validationCache = new Map<string, CacheEntry<ValidationRule>>();

/**
 * Get validation rule from cache
 * @param fieldType - Type of field to get rule for
 * @returns Cached validation rule or undefined if not found
 */
export function getRule(fieldType: string): ValidationRule | undefined {
  const cacheEntry = validationCache.get(fieldType);
  if (cacheEntry) {
    return cacheEntry.value;
  }
  return undefined;
}

/**
 * Cache validation rule
 * @param fieldType - Type of field
 * @param rule - Validation rule to cache
 */
export function cacheRule(fieldType: string, rule: ValidationRule): void {
  const cacheEntry: CacheEntry<ValidationRule> = {
    key: fieldType,
    value: rule,
    timestamp: Date.now()
  };
  validationCache.set(fieldType, cacheEntry);
}

/**
 * Clear validation cache
 */
export function clearCache(): void {
  validationCache.clear();
  console.log('Validation cache cleared');
}

/**
 * Get cache statistics
 * @returns Object with cache statistics
 */
export function getCacheStats(): { size: number; entries: string[] } {
  return {
    size: validationCache.size,
    entries: Array.from(validationCache.keys())
  };
}

/**
 * Initialize validation cache with all rules
 */
export function initializeValidationCache(): void {
  console.log('Initializing validation cache...');
  
  // Clear existing cache
  clearCache();
  
  // Cache all validation rules
  VALIDATION_RULES.forEach(rule => {
    cacheRule(rule.fieldType, rule);
  });
  
  console.log(`Validation cache initialized with ${VALIDATION_RULES.length} rules`);
} 