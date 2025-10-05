/**
 * version: 1.1.0
 * Validation service initialization
 * 
 * This file handles initialization of validation caches during server startup.
 * Now loads validation rules from database settings instead of hardcoded rules.
 * Backend file: init.validation.ts
 */

import { initializeValidationCache } from './cache.validation';
import { Request } from 'express';

/**
 * Initialize validation service
 * This function initializes both validation and security caches
 * @param req - Express request object for context (required for database access)
 */
export async function initializeValidationService(req: Request): Promise<void> {
  try {
    console.log('Initializing validation service...');
    
    // Initialize validation cache from database
    await initializeValidationCache(req);
    
    console.log('Validation service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize validation service:', error);
    throw new Error(`Critical error: Failed to initialize validation service - ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 