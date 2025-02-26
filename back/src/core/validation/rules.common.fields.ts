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
    MOBILE_PHONE: /^\+?[\d\s.()-]{10,15}$/,
    // Добавляем новые регулярные выражения из frontend
    NAME: /^[a-zA-Zа-яА-Я\- ]+$/,
    GENERAL_DESCRIPTION: /^[a-zA-Zа-яА-ЯёЁ0-9\s\-_.,!?()@#$%&'*+=/<>[\]{}"`~;:|]+$/,
    GROUP_NAME: /^[a-zA-Z0-9-]+$/, // Только латиница, цифры и дефис, как указано фронтендом
  };
  
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
        NO_LETTER: 'Username must contain at least one letter',
      },
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
        NO_NUMBER: 'Password must contain at least one number',
      },
    },
    EMAIL: {
      MAX_LENGTH: 255,
      MESSAGES: {
        REQUIRED: 'Email is required',
        INVALID: 'Invalid email address format',
        MAX_LENGTH: 'Email cannot exceed 255 characters',
      },
    },
    MOBILE_PHONE: {
      MIN_LENGTH: 10,
      MAX_LENGTH: 15,
      MESSAGES: {
        INVALID: 'Invalid mobile phone number format',
      },
    },
    // Добавляем новые правила из frontend
    FIRST_NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
      MESSAGES: {
        REQUIRED: 'First name is required',
        MIN_LENGTH: 'First name must be at least 2 characters long',
        MAX_LENGTH: 'First name cannot exceed 50 characters',
        INVALID_CHARS: 'First name can only contain letters, spaces and hyphens',
      },
    },
    MIDDLE_NAME: {
      MIN_LENGTH: 2, // добавляем как у других имен
      MAX_LENGTH: 50,
      MESSAGES: {
        MIN_LENGTH: 'Middle name must be at least 2 characters long', // добавляем сообщение
        MAX_LENGTH: 'Middle name cannot exceed 50 characters',
        INVALID_CHARS: 'Middle name can only contain letters, spaces and hyphens',
      },
    },
    LAST_NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
      MESSAGES: {
        REQUIRED: 'Last name is required',
        MIN_LENGTH: 'Last name must be at least 2 characters long',
        MAX_LENGTH: 'Last name cannot exceed 50 characters',
        INVALID_CHARS: 'Last name can only contain letters, spaces and hyphens',
      },
    },
    GENERAL_DESCRIPTION: {
      MAX_LENGTH: 5000,
      MESSAGES: {
        MAX_LENGTH: 'Description cannot exceed 5000 characters',
        INVALID_CHARS: 'Description contains invalid characters',
      },
    },
    GROUP_NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 100,
      MESSAGES: {
        REQUIRED: 'Group name is required',
        MIN_LENGTH: 'Group name must be at least 2 characters long',
        MAX_LENGTH: 'Group name cannot exceed 100 characters',
        INVALID_CHARS: 'Group name can only contain Latin letters, numbers, and hyphens',
      },
    },
  };