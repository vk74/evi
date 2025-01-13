/**
 * service.create.user.ts
 * Service layer for handling user creation from admin panel.
 * Handles validation, password hashing, and database operations.
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { pool as pgPool } from '../../../../db/maindb';
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

const pool = pgPool as Pool;

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

export async function createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
  const client = await pool.connect();
  
  try {
    // Validation
    await validateRequiredFields(userData);
    validatePassword(userData.password);
    await checkUniqueness(userData);

    // Password hashing
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Start transaction
    await client.query('BEGIN');

    // Create user
    const userResult = await client.query(
        queries.insertUser.text,
      [
        userData.username,
        hashedPassword,
        userData.email,
        userData.first_name,
        userData.last_name,
        userData.middle_name || null,
        userData.is_staff || false,
        userData.account_status || 'active'
      ]
    );
    
    const userId = userResult.rows[0].user_id;

    // Create user profile
    await client.query(
        queries.insertUserProfile.text,
      [
        userId,
        userData.gender || null,
        userData.mobile_phone_number || null,
        userData.address || null,
        userData.company_name || null,
        userData.position || null
      ]
    );

    await client.query('COMMIT');

    return {
      success: true,
      message: 'User account created successfully',
      userId,
      username: userData.username,
      email: userData.email
    };

  } catch (error) {
    await client.query('ROLLBACK');
    
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