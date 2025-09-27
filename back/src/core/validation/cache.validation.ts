/**
 * version: 1.0.1
 * Cache for validation rules
 * 
 * This file provides caching functionality for validation rules loaded from database settings.
 * Now integrates with the settings management system instead of using hardcoded rules.
 * Backend file: cache.validation.ts
 */

import { ValidationRule, CacheEntry } from './types.validation';
import { getValidationRules } from './service.load.validation.settings';
import { Request } from 'express';

// Cache for validation rules (now loaded from database)
const validationCache = new Map<string, CacheEntry<ValidationRule>>();

/**
 * Get validation rule from cache
 * @param fieldType - Type of field to get rule for
 * @param req - Express request object for context (required for database access)
 * @returns Cached validation rule or undefined if not found
 */
export async function getRule(fieldType: string, req: Request): Promise<ValidationRule | undefined> {
  const cacheEntry = validationCache.get(fieldType);
  if (cacheEntry) {
    return cacheEntry.value;
  }
  
  // If not in cache, try to load from database
  try {
    const rules = await getValidationRules(req);
    const rule = rules.get(fieldType);
    if (rule) {
      cacheRule(fieldType, rule);
      return rule;
    }
  } catch (error) {
    console.error(`Failed to load rule for field type ${fieldType}:`, error);
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
 * Initialize validation cache with rules from database
 * @param req - Express request object for context (required for database access)
 */
export async function initializeValidationCache(req: Request): Promise<void> {
  console.log('Initializing validation cache from database...');
  
  try {
    // Clear existing cache
    clearCache();
    
    // Load all validation rules from database
    const rules = await getValidationRules(req);
    
    // Cache all loaded rules
    rules.forEach((rule, fieldType) => {
      cacheRule(fieldType, rule);
    });
    
    console.log(`Validation cache initialized with ${rules.size} rules from database`);
  } catch (error) {
    console.error('Failed to initialize validation cache:', error);
    throw new Error(`Failed to initialize validation cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 