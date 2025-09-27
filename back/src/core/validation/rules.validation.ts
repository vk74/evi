/**
 * version: 1.0.1
 * Validation rules for different field types
 * 
 * This file contains hardcoded security validation rules.
 * Regular validation rules are now loaded from database settings.
 * Backend file: rules.validation.ts
 */

import { ValidationRule, FieldType } from './types.validation';

// Regular expressions copied from rules.common.fields.ts
export const REGEX = {
  USERNAME: /^[a-zA-Z0-9_]+$/,
  USERNAME_CONTAINS_LETTER: /[a-zA-Z]/,
  PASSWORD: /^[A-Za-z0-9!"#$%&'()*+,.-/:;<=>?@[\]^_`{|}~]+$/,
  PASSWORD_CONTAINS_LETTER: /[A-Za-z]/,
  PASSWORD_CONTAINS_NUMBER: /[0-9]/,
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  MOBILE_PHONE: /^\+?[\d\s.()-]{10,15}$/,
  NAME: /^[a-zA-Zа-яА-Я\- ]+$/,
  GENERAL_DESCRIPTION: /^[a-zA-Zа-яА-ЯёЁ0-9\s\-_.,!?()@#$%&'*+=/<>[\]{}"`~;:|]+$/,
  GROUP_NAME: /^[a-zA-Z0-9-]+$/,
  SERVICE_NAME: /^[a-zA-Zа-яА-ЯёЁ0-9\s\-_]+$/,
  DESCRIPTION: /^[a-zA-Zа-яА-ЯёЁ0-9\s\-_.,!?()@#$%&'*+=/<>[\]{}"`~;:|]+$/
};

// ============================================================================
// SECURITY VALIDATION RULES (HARDCODED FOR SECURITY)
// ============================================================================

const SECURITY_FIELDS: ValidationRule[] = [
  {
    fieldType: 'password',
    regex: REGEX.PASSWORD,
    minLength: 8,
    maxLength: 40,
    required: true,
    messages: {
      required: 'Password is required',
      minLength: 'Password must be at least 8 characters long',
      maxLength: 'Password cannot exceed 40 characters',
      invalidChars: 'Password may contain only Latin letters, numbers and common special characters',
      noLetter: 'Password must contain at least one letter',
      noNumber: 'Password must contain at least one number'
    }
  }
];

// ============================================================================
// COMBINED VALIDATION RULES (ONLY SECURITY FIELDS)
// ============================================================================

export const VALIDATION_RULES: ValidationRule[] = [
  ...SECURITY_FIELDS
];

/**
 * Get validation rule for specific field type
 * @param fieldType - Type of field to get rule for
 * @returns Validation rule or undefined if not found
 */
export function getRuleForField(fieldType: FieldType): ValidationRule | undefined {
  return VALIDATION_RULES.find(rule => rule.fieldType === fieldType);
}

/**
 * Validate value by rule
 * @param value - Value to validate
 * @param rule - Validation rule to apply
 * @returns Validation result with error message if invalid
 */
export function validateByRule(value: string | number, rule: ValidationRule): { isValid: boolean; error?: string } {
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

  // Check regex pattern
  if (rule.regex && !rule.regex.test(stringValue)) {
    return { isValid: false, error: rule.messages.invalidChars || rule.messages.invalid };
  }

  // Check for required characters in password
  if (rule.fieldType === 'password') {
    if (!REGEX.PASSWORD_CONTAINS_LETTER.test(stringValue)) {
      return { isValid: false, error: rule.messages.noLetter };
    }
    if (!REGEX.PASSWORD_CONTAINS_NUMBER.test(stringValue)) {
      return { isValid: false, error: rule.messages.noNumber };
    }
  }

  // Check for required characters in userName (well-known field)
  if (rule.fieldType === 'userName' && !REGEX.USERNAME_CONTAINS_LETTER.test(stringValue)) {
    return { isValid: false, error: rule.messages.noLetter };
  }

  return { isValid: true };
} 