/**
 * version: 1.2.0
 * Types and interfaces for validation service
 * 
 * This file defines all types and interfaces used by the validation service.
 * Backend file: types.validation.ts
 */

// Field types supported by the validator
export type FieldType = 
  // Well-known fields only
  | 'userName'           // wellKnownFields.userName
  | 'groupName'          // wellKnownFields.groupName  
  | 'email'              // wellKnownFields.email
  | 'telephoneNumber';   // wellKnownFields.telephoneNumber

// Note: Password validation is handled separately by password policies system
// and is not part of the main validator

// Validation request interface
export interface ValidationRequest {
  value: string | number;
  fieldType: FieldType;
}

// Validation response interface
export interface ValidationResponse {
  isValid: boolean;
  error?: string;
}

// Validation error interface
export interface ValidationError {
  type: 'validation';
  message: string;
  fieldType: FieldType;
  value: string | number;
}

// Security interfaces removed: security validation is handled by request guard

// Validation rule interface
export interface ValidationRule {
  fieldType: FieldType;
  regex?: RegExp;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  messages: {
    required?: string;
    minLength?: string;
    maxLength?: string;
    invalidChars?: string;
    noLetter?: string;
    noNumber?: string;
    invalid?: string;
  };
}

// Cache entry interface
export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
} 