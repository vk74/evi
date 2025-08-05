/**
 * version: 1.0.0
 * Example usage of validation service
 * 
 * This file demonstrates how to use the validation service in business services.
 * Backend file: example.usage.ts
 */

import { validateField, validateFieldAndThrow } from './service.validation';
import { ValidationRequest } from './types.validation';

/**
 * Example: Validate user registration data
 * This shows how business services should use the validator
 */
export function validateUserRegistration(userData: {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate each field individually
  const validations: ValidationRequest[] = [
    { value: userData.username, fieldType: 'username' },
    { value: userData.password, fieldType: 'password' },
    { value: userData.email, fieldType: 'email' },
    { value: userData.firstName, fieldType: 'first_name' },
    { value: userData.lastName, fieldType: 'last_name' }
  ];
  
  // Check each field
  validations.forEach(validation => {
    const result = validateField(validation);
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Example: Validate field and throw exception
 * This shows how to use the throw version for immediate error handling
 */
export function validateServiceName(serviceName: string): void {
  try {
    validateFieldAndThrow({
      value: serviceName,
      fieldType: 'service_name'
    });
    console.log('Service name validation passed');
  } catch (error) {
    console.error('Service name validation failed:', error.message);
    throw error; // Re-throw to be handled by calling service
  }
}

/**
 * Example: Security threat detection
 * This demonstrates how security threats are detected
 */
export function testSecurityValidation(): void {
  const testCases = [
    { value: "admin'; DROP TABLE users; --", fieldType: 'username' },
    { value: "<script>alert('xss')</script>", fieldType: 'description' },
    { value: "normal_username", fieldType: 'username' },
    { value: "valid@email.com", fieldType: 'email' }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\nTesting: ${testCase.value} (${testCase.fieldType})`);
    const result = validateField(testCase);
    console.log(`Result: ${result.isValid ? 'VALID' : 'INVALID'}`);
    if (!result.isValid) {
      console.log(`Error: ${result.error}`);
    }
  });
} 