/**
 * state.public.settings.ts - frontend file
 * version: 1.0.0
 * Simple state management for public password policies using Pinia.
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
 * Interface for the public settings store state
 */
interface PublicSettingsState {
  // Password policies cache
  passwordPolicies: PasswordPolicies | null;
  
  // Loading states
  isLoadingPasswordPolicies: boolean;
  
  // Error states
  passwordPoliciesError: string | null;
}

/**
 * Public Settings Store
 * Simple store for publicly available password policies
 */
export const usePublicSettingsStore = defineStore('publicSettings', {
  // Initial state
  state: (): PublicSettingsState => ({
    passwordPolicies: null,
    isLoadingPasswordPolicies: false,
    passwordPoliciesError: null
  }),
  
  // No complex getters needed - direct state access
  getters: {},
  
  // No complex actions needed - direct state mutations
  actions: {}
}); 