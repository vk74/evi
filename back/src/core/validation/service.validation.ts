/**
 * version: 1.0.0
 * Main validation service
 * 
 * This is the main validation service that other services use to validate fields.
 * Backend file: service.validation.ts
 */

import { ValidationRequest, ValidationResponse, ValidationError, SecurityError } from './types.validation';
import { getRule } from './cache.validation';
import { validateByRule } from './rules.validation';
import { securityCheck } from './security.validation';

/**
 * Validate a single field
 * @param request - Validation request with value and field type
 * @returns Validation response with result and optional error
 */
export function validateField(request: ValidationRequest): ValidationResponse {
  try {
    const { value, fieldType } = request;
    
    // Step 1: Security check (FIRST PRIORITY)
    const securityResult = securityCheck(value);
    if (!securityResult.isSecure) {
      console.log('Validation blocked by security check:', {
        fieldType,
        value: String(value).substring(0, 50),
        securityError: securityResult.error
      });
      
      return {
        isValid: false,
        error: securityResult.error?.message || 'Security threat detected'
      };
    }
    
    // Step 2: Get validation rule from cache
    const rule = getRule(fieldType);
    if (!rule) {
      console.log(`Validation rule not found for field type: ${fieldType}`);
      return {
        isValid: false,
        error: `Validation rule not found for field type: ${fieldType}`
      };
    }
    
    // Step 3: Apply validation rule
    const validationResult = validateByRule(value, rule);
    
    // Step 4: Log validation errors
    if (!validationResult.isValid) {
      console.log('Validation error:', {
        fieldType,
        value: String(value).substring(0, 50),
        error: validationResult.error
      });
    }
    
    // Step 5: Return validation response
    return {
      isValid: validationResult.isValid,
      error: validationResult.error
    };
    
  } catch (error) {
    console.error('Validation service error:', error);
    return {
      isValid: false,
      error: 'Internal validation error occurred'
    };
  }
}

/**
 * Validate field and throw exception if invalid
 * @param request - Validation request
 * @throws Error with validation error message
 */
export function validateFieldAndThrow(request: ValidationRequest): void {
  const result = validateField(request);
  
  if (!result.isValid) {
    throw new Error(result.error || 'Validation failed');
  }
}

/**
 * Get validation statistics
 * @returns Object with validation statistics
 */
export function getValidationStats(): { 
  validationRulesCount: number; 
  securityPatternsCount: number;
  cacheStats: { validation: any; security: any };
} {
  const { getCacheStats } = require('./cache.validation');
  const { getSecurityCacheStats } = require('./cache.security.validation');
  const { VALIDATION_RULES } = require('./rules.validation');
  const { SECURITY_PATTERNS } = require('./security.rules');
  
  return {
    validationRulesCount: VALIDATION_RULES.length,
    securityPatternsCount: SECURITY_PATTERNS.length,
    cacheStats: {
      validation: getCacheStats(),
      security: getSecurityCacheStats()
    }
  };
} 