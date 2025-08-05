/**
 * version: 1.0.0
 * Main validation service
 * 
 * This is the main validation service that other services use to validate fields.
 * Backend file: service.validation.ts
 */

import { ValidationRequest, ValidationResponse, ValidationError, SecurityError, FieldType } from './types.validation';
import { getRule } from './cache.validation';
import { validateByRule } from './rules.validation';
import { securityCheck } from './security.validation';
import { checkUserExists } from '../helpers/check.user.exists';
import { checkGroupExists } from '../helpers/check.group.exists';

/**
 * Validate a single field
 * @param request - Validation request with value and field type
 * @returns Validation response with result and optional error
 */
export function validateField(request: ValidationRequest): ValidationResponse {
  try {
    const { value, fieldType, securityOnly = false } = request;
    
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
    
    // If securityOnly is true, skip regular validation rules
    if (securityOnly) {
      console.log('Security-only validation passed for field type:', fieldType);
      return {
        isValid: true
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
 * Validate field security only (skip regular validation rules)
 * @param request - Validation request with securityOnly flag
 * @returns Validation response with result and optional error
 */
export function validateFieldSecurity(request: ValidationRequest): ValidationResponse {
  // Set securityOnly to true for this method
  const securityRequest = { ...request, securityOnly: true };
  return validateField(securityRequest);
}

/**
 * Validate field security only and throw exception if invalid
 * @param request - Validation request
 * @throws Error with validation error message
 */
export function validateFieldSecurityAndThrow(request: ValidationRequest): void {
  const result = validateFieldSecurity(request);
  
  if (!result.isValid) {
    throw new Error(result.error || 'Security validation failed');
  }
}

/**
 * Validate multiple values separated by comma
 * @param values - Comma-separated string
 * @param fieldType - Type of field to validate
 * @returns Validation response with all errors
 */
export function validateMultipleFields(values: string, fieldType: FieldType): ValidationResponse {
  const errors: string[] = [];
  const items = values.split(',').map(v => v.trim()).filter(v => v);
  
  for (const item of items) {
    const result = validateField({ value: item, fieldType });
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  }
  
  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined
  };
}

/**
 * Validate multiple usernames and check existence
 * @param usernames - Comma-separated usernames
 * @returns Validation response with existence errors
 */
export async function validateMultipleUsernames(usernames: string): Promise<ValidationResponse> {
  const errors: string[] = [];
  const items = usernames.split(',').map(v => v.trim()).filter(v => v);
  
  // First validate format for each username
  for (const item of items) {
    const result = validateField({ value: item, fieldType: 'username' });
    if (!result.isValid && result.error) {
      errors.push(`Username "${item}": ${result.error}`);
    }
  }
  
  // If format validation passed, check existence
  if (errors.length === 0) {
    for (const username of items) {
      const exists = await checkUserExists(username);
      if (!exists) {
        errors.push(`Username "${username}" does not exist`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined
  };
}

/**
 * Validate multiple group names and check existence
 * @param groupNames - Comma-separated group names
 * @returns Validation response with existence errors
 */
export async function validateMultipleGroupNames(groupNames: string): Promise<ValidationResponse> {
  const errors: string[] = [];
  const items = groupNames.split(',').map(v => v.trim()).filter(v => v);
  
  // First validate format for each group name
  for (const item of items) {
    const result = validateField({ value: item, fieldType: 'group_name' });
    if (!result.isValid && result.error) {
      errors.push(`Group name "${item}": ${result.error}`);
    }
  }
  
  // If format validation passed, check existence
  if (errors.length === 0) {
    for (const groupName of items) {
      const exists = await checkGroupExists(groupName);
      if (!exists) {
        errors.push(`Group name "${groupName}" does not exist`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined
  };
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