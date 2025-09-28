/**
 * state.public.settings.ts - frontend file
 * version: 1.0.1
 * Simple state management for public settings using Pinia.
 * Basic caching without localStorage complexity.
 */

import { defineStore } from 'pinia';

/**
 * Interface for password policies from public API
 */
export interface PasswordPolicies {
  minLength: number;
  maxLength: number;
  requireLowercase: boolean;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  allowedSpecialChars: string;
}

/**
 * Interface for validation rules from public API
 */
export interface ValidationRules {
  standardFields: {
    textMicro: { maxLength: number };
    textMini: { maxLength: number };
    textShort: { maxLength: number };
    textMedium: { maxLength: number };
    textLong: { maxLength: number };
    textExtraLong: { maxLength: number };
    allowSpecialChars: boolean;
  };
  wellKnownFields: {
    email: { regex: string };
    groupName: { 
      minLength: number; 
      maxLength: number; 
      latinOnly: boolean; 
      allowNumbers: boolean; 
      allowUsernameChars: boolean; 
    };
    telephoneNumber: { 
      regex: string;
      mask: string; 
    };
    userName: { 
      minLength: number; 
      maxLength: number; 
      latinOnly: boolean; 
      allowNumbers: boolean; 
      allowUsernameChars: boolean; 
    };
  };
}

/**
 * Interface for the public settings store state
 */
interface PublicSettingsState {
  // Password policies cache
  passwordPolicies: PasswordPolicies | null;
  
  // Validation rules cache
  validationRules: ValidationRules | null;
  
  // Loading states
  isLoadingPasswordPolicies: boolean;
  isLoadingValidationRules: boolean;
  
  // Error states
  passwordPoliciesError: string | null;
  validationRulesError: string | null;
}

/**
 * Public Settings Store
 * Simple store for publicly available settings
 */
export const usePublicSettingsStore = defineStore('publicSettings', {
  // Initial state
  state: (): PublicSettingsState => ({
    passwordPolicies: null,
    validationRules: null,
    isLoadingPasswordPolicies: false,
    isLoadingValidationRules: false,
    passwordPoliciesError: null,
    validationRulesError: null
  }),
  
  // No complex getters needed - direct state access
  getters: {},
  
  // No complex actions needed - direct state mutations
  actions: {}
}); 