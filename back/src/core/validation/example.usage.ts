/**
 * version: 1.0.1
 * Example usage of validation service
 * 
 * This file demonstrates how to use the validation service in business services.
 * Updated for new async API with database settings integration.
 * Backend file: example.usage.ts
 */

import { validateField, validateFieldAndThrow } from './service.validation';
import { ValidationRequest } from './types.validation';
import { Request } from 'express';

/**
 * Example: Validate user registration data
 * This shows how business services should use the validator
 */
export async function validateUserRegistration(userData: {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}, req: Request): Promise<{ isValid: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  // Validate each field individually
  const validations: ValidationRequest[] = [
    { value: userData.username, fieldType: 'userName' },        // Updated field type
    // Note: password validation is handled separately by password policies system
    { value: userData.email, fieldType: 'email' },
    { value: userData.firstName, fieldType: 'text-mini' },     // Use standard field
    { value: userData.lastName, fieldType: 'text-mini' }       // Use standard field
  ];
  
  // Check each field (now async)
  for (const validation of validations) {
    const result = await validateField(validation, req);
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Example: Validate field and throw exception
 * This shows how to use the throw version for immediate error handling
 */
export async function validateServiceName(serviceName: string, req: Request): Promise<void> {
  try {
    await validateFieldAndThrow({
      value: serviceName,
      fieldType: 'text-medium'  // Use standard field instead of service_name
    }, req);
    console.log('Service name validation passed');
  } catch (error) {
    console.error('Service name validation failed:', (error as Error).message);
    throw error; // Re-throw to be handled by calling service
  }
}

/**
 * Example: Security threat detection
 * This demonstrates how security threats are detected
 */
export async function testSecurityValidation(req: Request): Promise<void> {
  const testCases: ValidationRequest[] = [
    { value: "admin'; DROP TABLE users; --", fieldType: 'userName' },     // Updated field type
    { value: "<script>alert('xss')</script>", fieldType: 'text-long' },  // Use standard field
    { value: "normal_username", fieldType: 'userName' },                  // Updated field type
    { value: "valid@email.com", fieldType: 'email' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.value} (${testCase.fieldType})`);
    const result = await validateField(testCase, req);
    console.log(`Result: ${result.isValid ? 'VALID' : 'INVALID'}`);
    if (!result.isValid) {
      console.log(`Error: ${result.error}`);
    }
  }
} 