/**
 * BACKEND service.create.user.ts - version 1.0.06
 * Service layer for handling user creation from admin panel.
 * Backend file that handles validation, password hashing, and database operations.
 * Features: Dynamic validation for username/email/phone, event bus integration, field name updates.
 */

import { Request } from 'express';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.user.editor';
import { validateFieldAndThrow } from '../../../../core/validation/service.validation';
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
    mobile_phone: data.mobile_phone?.trim(),
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

async function validateUsername(username: string, req: Request): Promise<void> {
  try {
    await validateFieldAndThrow({ value: username, fieldType: 'userName' }, req);
  } catch (error) {
    throw {
      code: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Username validation failed',
      field: 'username'
    } as ValidationError;
  }
}

// Password validation using dynamic settings from cache (separate from main validator)
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

async function validateEmail(email: string, req: Request): Promise<void> {
  try {
    await validateFieldAndThrow({ value: email, fieldType: 'email' }, req);
  } catch (error) {
    throw {
      code: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Email validation failed',
      field: 'email'
    } as ValidationError;
  }
}

async function validateName(name: string, field: 'first_name' | 'middle_name' | 'last_name', req: Request): Promise<void> {
  try {
    // Content validation now relies on well-known fields or DB constraints
    // Names validated via DB constraints and universal guards; no standard text buckets
  } catch (error) {
    throw {
      code: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : `${field} validation failed`,
      field
    } as ValidationError;
  }
}

async function validateMobilePhone(phone: string, req: Request): Promise<void> {
  try {
    await validateFieldAndThrow({ value: phone, fieldType: 'telephoneNumber' }, req);
  } catch (error) {
    throw {
      code: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : 'Mobile phone validation failed',
      field: 'mobile_phone'
    } as ValidationError;
  }
}

// Main validation function
async function validateData(data: CreateUserRequest, req: Request): Promise<void> {
  try {
    await validateUsername(data.username, req);
    await validatePassword(data.password, data.username, req);
    await validateEmail(data.email, req);
    await validateName(data.first_name, 'first_name', req);
    await validateName(data.last_name, 'last_name', req);
    
    if (data.middle_name) {
      await validateName(data.middle_name, 'middle_name', req);
    }
    
    if (data.mobile_phone) {
      await validateMobilePhone(data.mobile_phone, req);
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
  
    if (data.mobile_phone) {
      uniqueChecks.push({
        query: queries.checkPhone.text,
        params: [data.mobile_phone],
        field: 'mobile_phone',
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

    // Create user (now includes profile data)
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
        trimmedData.account_status || 'active',
        trimmedData.gender ? trimmedData.gender : 'n',
        trimmedData.mobile_phone ? trimmedData.mobile_phone : null
      ]
    );
    
    const userId = userResult.rows[0].user_id;

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