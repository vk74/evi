/**
 * legacy.validation.ts - backend file
 * version: 1.1.0
 * Temporary legacy validation functions for backward compatibility
 * Security-only legacy API removed; functions return valid by design.
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
// Security-only legacy API removed; kept as no-op if still imported elsewhere
export function validateFieldSecurityLegacy(...args: any[]): ValidationResponse {
  return { isValid: true };
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
