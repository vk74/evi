/**
 * version: 1.0.0
 * Validation rules for different field types
 * 
 * This file contains validation rules organized by sections.
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
// USER FIELDS SECTION
// ============================================================================

const USER_FIELDS: ValidationRule[] = [
  {
    fieldType: 'username',
    regex: REGEX.USERNAME,
    minLength: 3,
    maxLength: 25,
    required: true,
    messages: {
      required: 'Username is required',
      minLength: 'Username must be at least 3 characters long',
      maxLength: 'Username cannot exceed 25 characters',
      invalidChars: 'Username can only contain Latin letters, numbers and underscores',
      noLetter: 'Username must contain at least one letter'
    }
  },
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
  },
  {
    fieldType: 'email',
    regex: REGEX.EMAIL,
    maxLength: 255,
    required: true,
    messages: {
      required: 'Email is required',
      invalid: 'Invalid email address format',
      maxLength: 'Email cannot exceed 255 characters'
    }
  },
  {
    fieldType: 'mobile_phone',
    regex: REGEX.MOBILE_PHONE,
    minLength: 10,
    maxLength: 15,
    messages: {
      invalid: 'Invalid mobile phone number format'
    }
  },
  {
    fieldType: 'first_name',
    regex: REGEX.NAME,
    minLength: 2,
    maxLength: 50,
    required: true,
    messages: {
      required: 'First name is required',
      minLength: 'First name must be at least 2 characters long',
      maxLength: 'First name cannot exceed 50 characters',
      invalidChars: 'First name can only contain letters, spaces and hyphens'
    }
  },
  {
    fieldType: 'middle_name',
    regex: REGEX.NAME,
    minLength: 2,
    maxLength: 50,
    messages: {
      minLength: 'Middle name must be at least 2 characters long',
      maxLength: 'Middle name cannot exceed 50 characters',
      invalidChars: 'Middle name can only contain letters, spaces and hyphens'
    }
  },
  {
    fieldType: 'last_name',
    regex: REGEX.NAME,
    minLength: 2,
    maxLength: 50,
    required: true,
    messages: {
      required: 'Last name is required',
      minLength: 'Last name must be at least 2 characters long',
      maxLength: 'Last name cannot exceed 50 characters',
      invalidChars: 'Last name can only contain letters, spaces and hyphens'
    }
  }
];

// ============================================================================
// GROUP FIELDS SECTION
// ============================================================================

const GROUP_FIELDS: ValidationRule[] = [
  {
    fieldType: 'group_name',
    regex: REGEX.GROUP_NAME,
    minLength: 2,
    maxLength: 100,
    required: true,
    messages: {
      required: 'Group name is required',
      minLength: 'Group name must be at least 2 characters long',
      maxLength: 'Group name cannot exceed 100 characters',
      invalidChars: 'Group name can only contain Latin letters, numbers, and hyphens'
    }
  }
];

// ============================================================================
// SERVICE FIELDS SECTION
// ============================================================================

const SERVICE_FIELDS: ValidationRule[] = [
  {
    fieldType: 'service_name',
    regex: REGEX.SERVICE_NAME,
    minLength: 2,
    maxLength: 250,
    required: true,
    messages: {
      required: 'Service name is required',
      minLength: 'Service name must be at least 2 characters long',
      maxLength: 'Service name cannot exceed 250 characters',
      invalidChars: 'Service name can only contain Latin and Cyrillic letters, numbers, spaces, hyphens and underscores'
    }
  },
  {
    fieldType: 'icon_name',
    regex: /^[a-zA-Z0-9\-_]+$/,
    maxLength: 100,
    required: false,
    messages: {
      maxLength: 'Icon name cannot exceed 100 characters',
      invalidChars: 'Icon name can only contain Latin letters, numbers, hyphens and underscores'
    }
  }
];

// ============================================================================
// COMMON FIELDS SECTION
// ============================================================================

const COMMON_FIELDS: ValidationRule[] = [
  {
    fieldType: 'general_description',
    regex: REGEX.GENERAL_DESCRIPTION,
    maxLength: 5000,
    messages: {
      maxLength: 'Description cannot exceed 5000 characters',
      invalidChars: 'Description contains invalid characters'
    }
  },
  {
    fieldType: 'description',
    regex: REGEX.DESCRIPTION,
    maxLength: 2000,
    messages: {
      maxLength: 'Description cannot exceed 2000 characters',
      invalidChars: 'Description contains invalid characters'
    }
  },
  {
    fieldType: 'long_description',
    regex: REGEX.DESCRIPTION,
    maxLength: 10000,
    messages: {
      maxLength: 'Description cannot exceed 10000 characters',
      invalidChars: 'Description contains invalid characters'
    }
  }
];

// ============================================================================
// COMBINED VALIDATION RULES
// ============================================================================

export const VALIDATION_RULES: ValidationRule[] = [
  ...USER_FIELDS,
  ...GROUP_FIELDS,
  ...SERVICE_FIELDS,
  ...COMMON_FIELDS
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

  // Check for required characters in username
  if (rule.fieldType === 'username' && !REGEX.USERNAME_CONTAINS_LETTER.test(stringValue)) {
    return { isValid: false, error: rule.messages.noLetter };
  }

  return { isValid: true };
} 