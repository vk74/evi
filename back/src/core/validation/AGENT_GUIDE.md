# Validation Service - Agent Usage Guide

## Quick Start

### Import the service
```typescript
import { validateField, validateFieldAndThrow, validateFieldSecurity, validateFieldSecurityAndThrow } from '@/core/validation/service.validation';
```

### Basic validation
```typescript
const result = validateField({
  value: "user123",
  fieldType: "username"
});

if (!result.isValid) {
  console.log('Error:', result.error);
}
```

## Request/Response Format

### ValidationRequest
```typescript
interface ValidationRequest {
  value: string | number;    // Field value to validate
  fieldType: FieldType;      // Type of field
  securityOnly?: boolean;    // If true, perform only security validation, skip regular validation rules
}
```

### ValidationResponse
```typescript
interface ValidationResponse {
  isValid: boolean;          // true if valid, false if invalid
  error?: string;           // Error message if isValid = false
}
```

## Usage Examples

### Validate single field
```typescript
const emailResult = validateField({
  value: "test@example.com",
  fieldType: "email"
});

if (!emailResult.isValid) {
  console.log('Email validation failed:', emailResult.error);
}
```

### Validate with exception throwing
```typescript
try {
  validateFieldAndThrow({
    value: serviceName,
    fieldType: 'service_name'
  });
  // Proceed if valid
} catch (error) {
  // Handle validation error
  console.error('Validation failed:', error.message);
}
```

### Security-only validation
```typescript
// For database fields with data_types - perform only security validation
const securityResult = validateFieldSecurity({
  value: databaseFieldValue,
  fieldType: 'description'  // fieldType is not important for security-only validation
});

if (!securityResult.isValid) {
  console.log('Security validation failed:', securityResult.error);
}
```

### Security-only validation with exception throwing
```typescript
try {
  validateFieldSecurityAndThrow({
    value: databaseFieldValue,
    fieldType: 'description'
  });
  // Proceed if security check passed
} catch (error) {
  // Handle security validation error
  console.error('Security validation failed:', error.message);
}
```

### Batch validation
```typescript
function validateMultipleFields(fields: ValidationRequest[]): string[] {
  const errors: string[] = [];
  fields.forEach(field => {
    const result = validateField(field);
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  });
  return errors;
}
```

### Batch security validation
```typescript
function validateMultipleFieldsSecurity(fields: ValidationRequest[]): string[] {
  const errors: string[] = [];
  fields.forEach(field => {
    const result = validateFieldSecurity(field);
    if (!result.isValid && result.error) {
      errors.push(result.error);
    }
  });
  return errors;
}
```

## Security Features

The validator automatically checks for security threats before validation rules are applied:
- SQL Injection, XSS Attacks, Command Injection, Path Traversal, NoSQL Injection, LDAP Injection

Security threats are blocked with clear error messages.

## Reference Files

- **Field types and rules**: `rules.validation.ts` - organized by sections (USER_FIELDS, GROUP_FIELDS, etc.)
- **Security patterns**: `rules.security.ts` - threat detection patterns
- **Types and interfaces**: `types.validation.ts` - ValidationRequest, ValidationResponse, FieldType
- **Main service**: `service.validation.ts` - validateField, validateFieldAndThrow, validateFieldSecurity, validateFieldSecurityAndThrow functions

## Adding New Field Types

### 1. Add to FieldType
```typescript
// In types.validation.ts
export type FieldType = 
  | 'username'
  | 'password'
  | 'email'
  // ... existing types
  | 'new_field_type';  // Add new type
```

### 2. Add validation rule
```typescript
// In rules.validation.ts - add to appropriate section
const NEW_FIELD_RULE: ValidationRule = {
  fieldType: 'new_field_type',
  regex: /^[a-zA-Z0-9]+$/,  // Your regex pattern
  minLength: 2,
  maxLength: 50,
  required: true,
  messages: {
    required: 'Field is required',
    minLength: 'Field must be at least 2 characters long',
    maxLength: 'Field cannot exceed 50 characters',
    invalidChars: 'Field contains invalid characters'
  }
};

// Add to appropriate section (USER_FIELDS, GROUP_FIELDS, etc.)
// Then add to VALIDATION_RULES array
```

### 3. Add regex pattern (if needed)
```typescript
// In rules.validation.ts
export const REGEX = {
  // ... existing patterns
  NEW_FIELD: /^[a-zA-Z0-9]+$/,  // Your regex
};
```

## Adding Security Patterns

### 1. Add to security patterns
```typescript
// In rules.security.ts
export const SECURITY_PATTERNS: SecurityPattern[] = [
  // ... existing patterns
  {
    name: 'New Threat Pattern',
    pattern: /your-regex-pattern/,
    threatLevel: 'high',  // 'low' | 'medium' | 'high' | 'critical'
    description: 'Description of the threat'
  }
];
```

### 2. Restart server
The cache will be automatically updated with new patterns.

## Best Practices

1. **Validate each field individually** - Don't validate entire objects
2. **Handle errors gracefully** - Always check `result.isValid`
3. **Use appropriate field types** - Match field types to data
4. **Security first** - Validator blocks threats automatically
5. **Clear error messages** - Errors are user-friendly
6. **Database fields with data_types** - For fields that have database data_types, use `validateFieldSecurity()` method to perform only security validation, skip regular validation rules 