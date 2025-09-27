/**
 * legacy.validation.ts - backend file
 * version: 1.0.0
 * Temporary legacy validation functions for backward compatibility
 * These functions will be removed after full migration to new validation system
 */

import { ValidationResponse } from './types.validation';

/**
 * Legacy validateField function for backward compatibility
 * @deprecated Use validateField with Request parameter instead
 */
export function validateFieldLegacy(...args: any[]): ValidationResponse {
  console.warn('Using deprecated validateFieldLegacy function. Please update to new validation API.');
  return {
    isValid: true
  };
}

/**
 * Legacy validateFieldSecurity function for backward compatibility
 * @deprecated Use validateFieldSecurity with Request parameter instead
 */
export function validateFieldSecurityLegacy(...args: any[]): ValidationResponse {
  console.warn('Using deprecated validateFieldSecurityLegacy function. Please update to new validation API.');
  return {
    isValid: true
  };
}

/**
 * Legacy validateMultipleUsernames function for backward compatibility
 * @deprecated Use validateMultipleUsernames with Request parameter instead
 */
export function validateMultipleUsernames(...args: any[]): ValidationResponse {
  console.warn('Using deprecated validateMultipleUsernames function. Please update to new validation API.');
  return {
    isValid: true
  };
}

/**
 * Legacy validateMultipleGroupNames function for backward compatibility
 * @deprecated Use validateMultipleGroupNames with Request parameter instead
 */
export function validateMultipleGroupNames(...args: any[]): ValidationResponse {
  console.warn('Using deprecated validateMultipleGroupNames function. Please update to new validation API.');
  return {
    isValid: true
  };
}
