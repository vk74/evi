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

// Password validation using new validation service (hardcoded security rules)
async function validatePassword(password: string, username: string, req: Request): Promise<void> {
  // Create event for password policy check start
  await createAndPublishEvent({
    req,
    eventName: USER_CREATION_EVENTS.PASSWORD_POLICY_CHECK_START.eventName,
    payload: { username }
  });

  try {
    await validateFieldAndThrow({ value: password, fieldType: 'password' }, req);
  } catch (error) {
    await createAndPublishEvent({
      req,
      eventName: USER_CREATION_EVENTS.PASSWORD_POLICY_CHECK_FAILED.eventName,
      payload: { 
        username,
        policyViolations: [error instanceof Error ? error.message : 'Password validation failed']
      },
      errorData: error instanceof Error ? error.message : 'Password validation failed'
    });
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Password does not meet account security policies',
      field: 'password'
    } as ValidationError;
  }

  // Create event for successful password policy check
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
    // Use text-mini for names (up to 20 characters)
    await validateFieldAndThrow({ value: name, fieldType: 'text-mini' }, req);
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
      field: 'mobile_phone_number'
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
    
    if (data.mobile_phone_number) {
      await validateMobilePhone(data.mobile_phone_number, req);
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