/**
 * BACKEND service.create.user.ts - version 1.0.04
 * Service layer for handling user creation from admin panel.
 * Handles validation, password hashing, and database operations.
 * Now includes event bus integration for logging and tracking user creation events.
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
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USER_CREATION_EVENTS } from './events.user.editor';
import { eventBus } from '../../../../core/eventBus/bus.events';

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

function validatePassword(password: string): void {
  if (password.length < VALIDATION.PASSWORD.MIN_LENGTH) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.PASSWORD.MESSAGES.MIN_LENGTH,
      field: 'password'
    } as ValidationError;
  }

  if (password.length > VALIDATION.PASSWORD.MAX_LENGTH) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.PASSWORD.MESSAGES.MAX_LENGTH,
      field: 'password'
    } as ValidationError;
  }

  if (!REGEX.PASSWORD.test(password)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.PASSWORD.MESSAGES.INVALID_CHARS,
      field: 'password'
    } as ValidationError;
  }

  if (!REGEX.PASSWORD_CONTAINS_LETTER.test(password)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.PASSWORD.MESSAGES.NO_LETTER,
      field: 'password'
    } as ValidationError;
  }

  if (!REGEX.PASSWORD_CONTAINS_NUMBER.test(password)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: VALIDATION.PASSWORD.MESSAGES.NO_NUMBER,
      field: 'password'
    } as ValidationError;
  }
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

// Main validation function
async function validateData(data: CreateUserRequest, req: Request): Promise<void> {
  try {
    validateUsername(data.username);
    validatePassword(data.password);
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
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_CREATION_EVENTS.VALIDATION_PASSED.eventName,
      payload: {
        username: data.username,
        email: data.email
      }
    });
    
  } catch (error) {
    // Create and publish validation failed event using the fabric
    await fabricEvents.createAndPublishEvent({
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
        trimmedData.middle_name || null,
        trimmedData.is_staff || false,
        trimmedData.account_status || 'active'
      ]
    );
    
    const userId = userResult.rows[0].user_id;

    // Create user profile
    await client.query(
        queries.insertUserProfile.text,
      [
        userId,
        trimmedData.gender || null,
        trimmedData.mobile_phone_number || null,
        trimmedData.address || null,
        trimmedData.company_name || null,
        trimmedData.position || null
      ]
    );

    await client.query('COMMIT');

    // Create and publish completion event
    await fabricEvents.createAndPublishEvent({
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
    await fabricEvents.createAndPublishEvent({
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