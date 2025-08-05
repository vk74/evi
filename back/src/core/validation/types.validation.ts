/**
 * version: 1.0.0
 * Types and interfaces for validation service
 * 
 * This file defines all types and interfaces used by the validation service.
 * Backend file: types.validation.ts
 */

// Field types supported by the validator
export type FieldType = 
  | 'username'
  | 'password'
  | 'email'
  | 'mobile_phone'
  | 'first_name'
  | 'middle_name'
  | 'last_name'
  | 'general_description'
  | 'group_name'
  | 'service_name'
  | 'description'
  | 'long_description'
  | 'icon_name';

// Validation request interface
export interface ValidationRequest {
  value: string | number;
  fieldType: FieldType;
  securityOnly?: boolean;  // If true, perform only security validation, skip regular validation rules
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

// Security error interface
export interface SecurityError {
  type: 'security';
  message: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  pattern: string;
  value: string | number;
}

// Security threat pattern interface
export interface SecurityPattern {
  name: string;
  pattern: RegExp;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

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