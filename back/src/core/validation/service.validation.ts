/**
 * version: 1.2.0
 * Main validation service
 * 
 * This is the main validation service that other services use to validate fields.
 * Performs only business/format validation using rules loaded from database settings.
 * Backend file: service.validation.ts
 * 
 * Changes in v1.2.0:
 * - Removed dependency on legacy rules.validation.ts
 * - Validation logic now implemented directly using rules from database
 * - No hardcoded legacy checks, fully dynamic validation
 */

import { ValidationRequest, ValidationResponse, FieldType, ValidationRule } from './types.validation';
import { getRule } from './cache.validation';
import { getUuidByUsername } from '../helpers/get.uuid.by.username';
import { getUuidByGroupName } from '../helpers/get.uuid.by.group.name';
import { Request } from 'express';

/**
 * Validate value by rule (internal function, replaces legacy validateByRule)
 * @param value - Value to validate
 * @param rule - Validation rule to apply
 * @returns Validation result with error message if invalid
 */
function applyValidationRule(value: string | number, rule: ValidationRule): { isValid: boolean; error?: string } {
  const stringValue = String(value);

  // Check if required
  if (rule.required && (!stringValue || stringValue.trim() === '')) {
    return { isValid: false, error: rule.messages.required };
  }

  // Skip validation for empty optional fields
  if (!rule.required && (!stringValue || stringValue.trim() === '')) {
    return { isValid: true };
  }

  // Check minimum length
  if (rule.minLength && stringValue.length < rule.minLength) {
    return { isValid: false, error: rule.messages.minLength };
  }

  // Check maximum length
  if (rule.maxLength && stringValue.length > rule.maxLength) {
    return { isValid: false, error: rule.messages.maxLength };
  }

  // Check regex pattern - this is the ONLY format check, fully dynamic from database
  if (rule.regex && !rule.regex.test(stringValue)) {
    return { isValid: false, error: rule.messages.invalidChars || rule.messages.invalid };
  }

  // All validation checks passed
  return { isValid: true };
}

/**
 * Validate a single field
 * @param request - Validation request with value and field type
 * @param req - Express request object for context (required for database access)
 * @returns Validation response with result and optional error
 */
export async function validateField(request: ValidationRequest, req: Request): Promise<ValidationResponse> {
  try {
    const { value, fieldType } = request;
    
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
    const validationResult = applyValidationRule(value, rule);
    
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
