/**
 * BACKEND service.create.user.ts - version 1.0.05
 * Service layer for handling user creation from admin panel.
 * Handles validation, password hashing, and database operations.
 * Now includes event bus integration for logging and tracking user creation events.
 * Password validation now uses dynamic settings from cache.
 */

import { Request } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.user.editor';
import { REGEX, VALIDATION } from '../../../../core/validation/rules.common.fields';
import type { 
  CreateUserRequest, 
  CreateUserResponse,
  ValidationError,
  UniqueCheckError,
  RequiredFieldError,
  ServiceError
} from './types.user.editor';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import { createAndPublishEvent } from '../../../../core/eventBus/fabric.events';
import { USER_CREATION_EVENTS } from './events.user.editor';
import { eventBus } from '../../../../core/eventBus/bus.events';
import { getSetting } from '../../settings/cache.settings';
import type { AppSetting } from '../../settings/types.settings';

const pool = pgPool as Pool;

// Data preparation
function trimData(data: CreateUserRequest): CreateUserRequest {
  return {
    ...data,
    username: data.username?.trim(),
    email: data.email?.trim(),
    mobile_phone_number: data.mobile_phone_number?.trim(),
  };
}

// Validation functions
async function validateRequiredFields(data: CreateUserRequest): Promise<void> {
  const requiredFields = {
    username: 'Username',
    password: 'Password',
    email: 'Email',
    first_name: 'First name',
    last_name: 'Last name'
  } as const;

  const missingFields = Object.entries(requiredFields)
    .filter(([field]) => !data[field as keyof typeof requiredFields])
    .map(([, label]) => label);

  if (missingFields.length > 0) {
    throw {
      code: 'REQUIRED_FIELD_ERROR',
      message: `Missing required fields: ${missingFields.join(', ')}`,
      field: missingFields[0].toLowerCase()
    } as RequiredFieldError;
  }
}

function validateUsername(username: string): void {
  if (username.length < VALIDATION.USERNAME.MIN_LENGTH) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.USERNAME.MESSAGES.MIN_LENGTH,
      field: 'username'
    } as ValidationError;
  }

  if (username.length > VALIDATION.USERNAME.MAX_LENGTH) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.USERNAME.MESSAGES.MAX_LENGTH,
      field: 'username'
    } as ValidationError;
  }

  if (!REGEX.USERNAME.test(username)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.USERNAME.MESSAGES.INVALID_CHARS,
      field: 'username'
    } as ValidationError;
  }

  if (!REGEX.USERNAME_CONTAINS_LETTER.test(username)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.USERNAME.MESSAGES.NO_LETTER,
      field: 'username'
    } as ValidationError;
  }
}

// Password validation using dynamic settings from cache
async function validatePassword(password: string, username: string, req: Request): Promise<void> {
  // Create event for password policy check start
  await createAndPublishEvent({
    req,
    eventName: USER_CREATION_EVENTS.PASSWORD_POLICY_CHECK_START.eventName,
    payload: { username }
  });

  // Get password policy settings from cache
  const minLengthSetting = getSetting('Application.Security.PasswordPolicies', 'password.min.length');
  const maxLengthSetting = getSetting('Application.Security.PasswordPolicies', 'password.max.length');
  const requireUppercaseSetting = getSetting('Application.Security.PasswordPolicies', 'password.require.uppercase');
  const requireLowercaseSetting = getSetting('Application.Security.PasswordPolicies', 'password.require.lowercase');
  const requireNumbersSetting = getSetting('Application.Security.PasswordPolicies', 'password.require.numbers');
  const requireSpecialCharsSetting = getSetting('Application.Security.PasswordPolicies', 'password.require.special.chars');
  const allowedSpecialCharsSetting = getSetting('Application.Security.PasswordPolicies', 'password.allowed.special.chars');

  // Check if all required settings are found
  if (!minLengthSetting || !maxLengthSetting || !requireUppercaseSetting || 
      !requireLowercaseSetting || !requireNumbersSetting || !requireSpecialCharsSetting || !allowedSpecialCharsSetting) {
    await createAndPublishEvent({
      req,
      eventName: USER_CREATION_EVENTS.PASSWORD_POLICY_SETTINGS_NOT_FOUND.eventName,
      payload: { username },
      errorData: 'Password policy settings not found in cache'
    });
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Password policy settings not found. Please contact the system administrator.',
      field: 'password'
    } as ValidationError;
  }

  const policyViolations: string[] = [];

  // Parse settings values
  const minLength = Number(minLengthSetting.value);
  const maxLength = Number(maxLengthSetting.value);
  const requireUppercase = Boolean(requireUppercaseSetting.value);
  const requireLowercase = Boolean(requireLowercaseSetting.value);
  const requireNumbers = Boolean(requireNumbersSetting.value);
  const requireSpecialChars = Boolean(requireSpecialCharsSetting.value);
  const allowedSpecialChars = allowedSpecialCharsSetting.value || '!@#$%^&*()_+-=[]{}|;:,.<>?';

  // Checks
  if (password.length < minLength) {
    policyViolations.push(`Password must be at least ${minLength} characters long`);
  }
  if (password.length > maxLength) {
    policyViolations.push(`Password must be no more than ${maxLength} characters long`);
  }
  if (requireUppercase && !/[A-Z]/.test(password)) {
    policyViolations.push('Password must contain at least one uppercase letter');
  }
  if (requireLowercase && !/[a-z]/.test(password)) {
    policyViolations.push('Password must contain at least one lowercase letter');
  }
  if (requireNumbers && !/\d/.test(password)) {
    policyViolations.push('Password must contain at least one digit');
  }
  if (requireSpecialChars) {
    const specialCharRegex = new RegExp(`[${allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharRegex.test(password)) {
      policyViolations.push('Password must contain at least one special character');
    }
  }

  if (policyViolations.length > 0) {
    await createAndPublishEvent({
      req,
      eventName: USER_CREATION_EVENTS.PASSWORD_POLICY_CHECK_FAILED.eventName,
      payload: { username, policyViolations },
      errorData: policyViolations.join(', ')
    });
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Password does not meet account security policies',
      field: 'password'
    } as ValidationError;
  }

  await createAndPublishEvent({
    req,
    eventName: USER_CREATION_EVENTS.PASSWORD_POLICY_CHECK_PASSED.eventName,
    payload: { username }
  });
}

function validateEmail(email: string): void {
  if (email.length > VALIDATION.EMAIL.MAX_LENGTH) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.EMAIL.MESSAGES.MAX_LENGTH,
      field: 'email'
    } as ValidationError;
  }

  if (!REGEX.EMAIL.test(email)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.EMAIL.MESSAGES.INVALID,
      field: 'email'
    } as ValidationError;
  }
}

function validateName(name: string, field: 'first_name' | 'middle_name' | 'last_name'): void {
  const validationRules = field === 'middle_name' 
    ? VALIDATION.MIDDLE_NAME 
    : field === 'first_name' 
      ? VALIDATION.FIRST_NAME 
      : VALIDATION.LAST_NAME;

  if (field !== 'middle_name' && name.length < validationRules.MIN_LENGTH) {
    throw {
      code: 'VALIDATION_ERROR',
      message: validationRules.MESSAGES.MIN_LENGTH,
      field
    } as ValidationError;
  }

  if (name.length > validationRules.MAX_LENGTH) {
    throw {
      code: 'VALIDATION_ERROR',
      message: validationRules.MESSAGES.MAX_LENGTH,
      field
    } as ValidationError;
  }

  if (!REGEX.NAME.test(name)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: validationRules.MESSAGES.INVALID_CHARS,
      field
    } as ValidationError;
  }
}

function validateMobilePhone(phone: string): void {
  if (!REGEX.MOBILE_PHONE.test(phone)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.MOBILE_PHONE.MESSAGES.INVALID,
      field: 'mobile_phone_number'
    } as ValidationError;
  }
}

// Main validation function
async function validateData(data: CreateUserRequest, req: Request): Promise<void> {
  try {
    validateUsername(data.username);
    await validatePassword(data.password, data.username, req);
    validateEmail(data.email);
    validateName(data.first_name, 'first_name');
    validateName(data.last_name, 'last_name');
    
    if (data.middle_name) {
      validateName(data.middle_name, 'middle_name');
    }
    
    if (data.mobile_phone_number) {
      validateMobilePhone(data.mobile_phone_number);
    }
    
    // Create event for validation start
    await createAndPublishEvent({
      req,
      eventName: USER_CREATION_EVENTS.VALIDATION_PASSED.eventName,
      payload: {
        username: data.username,
        email: data.email
      }
    });
    
  } catch (error) {
    // Create and publish validation failed event using the fabric
    await createAndPublishEvent({
      req,
      eventName: USER_CREATION_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        field: (error as ValidationError).field,
        message: (error as ValidationError).message
      },
      errorData: (error as ValidationError).message
    });
    
    // Re-throw the error to be handled upstream
    throw error;
  }
}

async function checkUniqueness(data: CreateUserRequest): Promise<void> {
    const uniqueChecks = [
      {
        query: queries.checkUsername.text,
        params: [data.username],
        field: 'username',
        message: 'Username is already taken'
      },
      {
        query: queries.checkEmail.text,
        params: [data.email],
        field: 'email',
        message: 'Email is already registered'
      }
    ];
  
    if (data.mobile_phone_number) {
      uniqueChecks.push({
        query: queries.checkPhone.text,
        params: [data.mobile_phone_number],
        field: 'mobile_phone_number',
        message: 'Phone number is already registered'
      });
    }
  
    for (const check of uniqueChecks) {
      const result = await pool.query(check.query, check.params);
      if (result.rows.length > 0) {
        throw {
          code: 'UNIQUE_CONSTRAINT_ERROR',
          message: check.message,
          field: check.field
        } as UniqueCheckError;
      }
    }
}

export async function createUser(userData: CreateUserRequest, req: Request): Promise<CreateUserResponse> {
  const client = await pool.connect();
  
  try {
    // Get the UUID of the user making the request
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Data preparation
    const trimmedData = trimData(userData);

    // Validation
    await validateRequiredFields(trimmedData);
    await validateData(trimmedData, req);
    await checkUniqueness(trimmedData);

    // Password hashing
    const hashedPassword = await bcrypt.hash(trimmedData.password, 10);

    // Start transaction
    await client.query('BEGIN');

    // Create user
    const userResult = await client.query(
        queries.insertUser.text,
      [
        trimmedData.username,
        hashedPassword,
        trimmedData.email,
        trimmedData.first_name,
        trimmedData.last_name,
        trimmedData.middle_name ? trimmedData.middle_name : null,
        typeof trimmedData.is_staff === 'boolean' ? trimmedData.is_staff : false,
        trimmedData.account_status || 'active'
      ]
    );
    
    const userId = userResult.rows[0].user_id;

    // Create user profile
    await client.query(
        queries.insertUserProfile.text,
      [
        userId,
        trimmedData.gender ? trimmedData.gender : 'n',
        trimmedData.mobile_phone_number ? trimmedData.mobile_phone_number : null,
        trimmedData.address ? trimmedData.address : null,
        trimmedData.company_name ? trimmedData.company_name : null,
        trimmedData.position ? trimmedData.position : null
      ]
    );

    await client.query('COMMIT');

    // Create and publish completion event
    await createAndPublishEvent({
      req,
      eventName: USER_CREATION_EVENTS.COMPLETE.eventName,
      payload: {
        userId,
        username: trimmedData.username,
        email: trimmedData.email
      }
    });

    return {
      success: true,
      message: 'User account created successfully',
      userId,
      username: trimmedData.username,
      email: trimmedData.email
    };

  } catch (error) {
    await client.query('ROLLBACK');
    
    // Create and publish failed event
    await createAndPublishEvent({
      req,
      eventName: USER_CREATION_EVENTS.FAILED.eventName,
      payload: {
        username: userData.username,
        error: (error as ServiceError).code ? error : { 
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : String(error)
        }
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    // Re-throw validation and uniqueness errors
    if ((error as ServiceError).code) {
      throw error;
    }

    // Handle unexpected errors
    throw {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create user account',
      details: error instanceof Error ? error.message : String(error)
    } as ServiceError;

  } finally {
    client.release();
  }
}

export default createUser;