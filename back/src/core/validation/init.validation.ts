/**
 * version: 1.0.0
 * Validation service initialization
 * 
 * This file handles initialization of validation caches during server startup.
 * Backend file: init.validation.ts
 */

import { initializeValidationCache } from './cache.validation';
import { initializeSecurityCache } from './cache.security.validation';

/**
 * Initialize validation service
 * This function initializes both validation and security caches
 */
export function initializeValidationService(): void {
  try {
    console.log('Initializing validation service...');
    
    // Initialize validation cache
    initializeValidationCache();
    
    // Initialize security cache
    initializeSecurityCache();
    
    console.log('Validation service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize validation service:', error);
    throw error;
  }
} 