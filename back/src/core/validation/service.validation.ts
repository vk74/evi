/**
 * version: 1.0.1
 * Main validation service
 * 
 * This is the main validation service that other services use to validate fields.
 * Now integrates with database settings instead of hardcoded rules.
 * Backend file: service.validation.ts
 */

import { ValidationRequest, ValidationResponse, ValidationError, SecurityError, FieldType } from './types.validation';
import { getRule } from './cache.validation';
import { validateByRule } from './rules.validation';
import { securityCheck } from './security.validation';
import { getUuidByUsername } from '../helpers/get.uuid.by.username';
import { getUuidByGroupName } from '../helpers/get.uuid.by.group.name';
import { Request } from 'express';

/**
 * Validate a single field
 * @param request - Validation request with value and field type
 * @param req - Express request object for context (required for database access)
 * @returns Validation response with result and optional error
 */
export async function validateField(request: ValidationRequest, req: Request): Promise<ValidationResponse> {
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
    
    // Step 2: Get validation rule from cache (now async and loads from DB if needed)
    const rule = await getRule(fieldType, req);
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
 * @param req - Express request object for context (required for database access)
 * @throws Error with validation error message
 */
export async function validateFieldAndThrow(request: ValidationRequest, req: Request): Promise<void> {
  const result = await validateField(request, req);
  
  if (!result.isValid) {
    throw new Error(result.error || 'Validation failed');
  }
}

/**
 * Validate field security only (skip regular validation rules)
 * @param request - Validation request with securityOnly flag
 * @param req - Express request object for context (required for database access)
 * @returns Validation response with result and optional error
 */
export async function validateFieldSecurity(request: ValidationRequest, req: Request): Promise<ValidationResponse> {
  // Set securityOnly to true for this method
  const securityRequest = { ...request, securityOnly: true };
  return await validateField(securityRequest, req);
}

/**
 * Validate field security only and throw exception if invalid
 * @param request - Validation request
 * @param req - Express request object for context (required for database access)
 * @throws Error with validation error message
 */
export async function validateFieldSecurityAndThrow(request: ValidationRequest, req: Request): Promise<void> {
  const result = await validateFieldSecurity(request, req);
  
  if (!result.isValid) {
    throw new Error(result.error || 'Security validation failed');
  }
}

/**
 * Validate multiple values separated by comma
 * @param values - Comma-separated string
 * @param fieldType - Type of field to validate
 * @param req - Express request object for context (required for database access)
 * @returns Validation response with all errors
 */
export async function validateMultipleFields(values: string, fieldType: FieldType, req: Request): Promise<ValidationResponse> {
  const errors: string[] = [];
  const items = values.split(',').map(v => v.trim()).filter(v => v);
  
  for (const item of items) {
    const result = await validateField({ value: item, fieldType }, req);
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
 * Validate multiple usernames (format only)
 * @param usernames - Comma-separated usernames
 * @param req - Express request object for context (required for database access)
 * @returns Validation response with format errors
 */
export async function validateMultipleUsernames(usernames: string, req: Request): Promise<ValidationResponse> {
  const errors: string[] = [];
  const items = usernames.split(',').map(v => v.trim()).filter(v => v);
  
  // Validate format for each username
  for (const item of items) {
    const result = await validateField({ value: item, fieldType: 'userName' }, req);
    if (!result.isValid && result.error) {
      errors.push(`Username "${item}": ${result.error}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined
  };
}

/**
 * Validate multiple group names (format only)
 * @param groupNames - Comma-separated group names
 * @param req - Express request object for context (required for database access)
 * @returns Validation response with format errors
 */
export async function validateMultipleGroupNames(groupNames: string, req: Request): Promise<ValidationResponse> {
  const errors: string[] = [];
  const items = groupNames.split(',').map(v => v.trim()).filter(v => v);
  
  // Validate format for each group name
  for (const item of items) {
    const result = await validateField({ value: item, fieldType: 'groupName' }, req);
    if (!result.isValid && result.error) {
      errors.push(`Group name "${item}": ${result.error}`);
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