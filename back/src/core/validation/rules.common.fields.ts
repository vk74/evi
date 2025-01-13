/**
 * rules.common.fields.ts - backend validation rules
 * Common validation rules and regex patterns for backend field validation.
 * Synchronized with frontend validation for consistent behavior.
 */

// Regular expressions
export const REGEX = {
    USERNAME: /^[a-zA-Z0-9]+$/,
    USERNAME_CONTAINS_LETTER: /[a-zA-Z]/,
    PASSWORD: /^[A-Za-z0-9!"#$%&'()*+,.-/:;<=>?@[\]^_`{|}~]+$/,
    PASSWORD_CONTAINS_LETTER: /[A-Za-z]/,
    PASSWORD_CONTAINS_NUMBER: /[0-9]/,
    EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    MOBILE_PHONE: /^\+?[\d\s.()-]{10,15}$/
  }
  
  // Validation rules with error messages
  export const VALIDATION = {
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 25,
      MESSAGES: {
        REQUIRED: 'Username is required',
        MIN_LENGTH: 'Username must be at least 3 characters long',
        MAX_LENGTH: 'Username cannot exceed 25 characters',
        INVALID_CHARS: 'Username can only contain Latin letters and numbers',
        NO_LETTER: 'Username must contain at least one letter'
      }
    },
    PASSWORD: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 40,
      MESSAGES: {
        REQUIRED: 'Password is required',
        MIN_LENGTH: 'Password must be at least 8 characters long',
        MAX_LENGTH: 'Password cannot exceed 40 characters',
        INVALID_CHARS: 'Password may contain only Latin letters, numbers and common special characters',
        NO_LETTER: 'Password must contain at least one letter',
        NO_NUMBER: 'Password must contain at least one number'
      }
    },
    EMAIL: {
      MAX_LENGTH: 255,
      MESSAGES: {
        REQUIRED: 'Email is required',
        INVALID: 'Invalid email address format',
        MAX_LENGTH: 'Email cannot exceed 255 characters'
      }
    },
    MOBILE_PHONE: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 15,
      MESSAGES: {
        INVALID: 'Invalid mobile phone number format'
      }
    }
  }