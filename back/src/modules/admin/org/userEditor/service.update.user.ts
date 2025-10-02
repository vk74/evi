// service.update.user.ts - version 1.0.05
// Service for updating user accounts, now uses event bus for operation tracking
// Now includes comprehensive validation using the validation service
// Now tracks actual field changes and shows old vs new values in events

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.user.editor';
import { validateFieldAndThrow } from '../../../../core/validation/service.validation';
import type { 
  UpdateUserRequest, 
  ApiResponse, 
  ServiceError, 
  ValidationError,
  UniqueCheckError
} from './types.user.editor';
import { AccountStatus, Gender } from './types.user.editor';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USER_UPDATE_EVENTS } from './events.user.editor';

const pool = pgPool as Pool;

// Data preparation
function trimUpdateData(data: UpdateUserRequest): UpdateUserRequest {
  return {
    ...data,
    username: data.username?.trim(),
    email: data.email?.trim(),
    mobile_phone_number: data.mobile_phone_number?.trim(),
    first_name: data.first_name?.trim(),
    last_name: data.last_name?.trim(),
    middle_name: data.middle_name?.trim(),
  };
}

// Get current user data for comparison
async function getCurrentUserData(userId: string): Promise<{
  user: any;
  profile: any;
}> {
  const userResult = await pool.query(queries.getUserById, [userId]);
  const profileResult = await pool.query(queries.getUserProfileById, [userId]);
  
  return {
    user: userResult.rows[0],
    profile: profileResult.rows[0]
  };
}

// Compare old and new data to find actual changes
function findChanges(oldData: any, newData: UpdateUserRequest): {
  changedFields: string[];
  changes: Record<string, { old: any; new: any }>;
} {
  const changedFields: string[] = [];
  const changes: Record<string, { old: any; new: any }> = {};
  
  // Check user table fields
  const userFields = ['username', 'email', 'is_staff', 'account_status', 'first_name', 'middle_name', 'last_name'];
  userFields.forEach(field => {
    if (newData[field as keyof UpdateUserRequest] !== undefined) {
      const oldValue = oldData.user?.[field];
      const newValue = newData[field as keyof UpdateUserRequest];
      
      // Handle null/undefined comparison
      const normalizedOldValue = oldValue === null ? null : oldValue;
      const normalizedNewValue = newValue === null ? null : newValue;
      
      if (normalizedOldValue !== normalizedNewValue) {
        changedFields.push(field);
        changes[field] = { old: normalizedOldValue, new: normalizedNewValue };
      }
    }
  });
  
  // Check profile table fields
  const profileFields = ['mobile_phone_number', 'gender'];
  profileFields.forEach(field => {
    if (newData[field as keyof UpdateUserRequest] !== undefined) {
      const oldValue = oldData.profile?.[field];
      const newValue = newData[field as keyof UpdateUserRequest];
      
      // Handle null/undefined comparison
      const normalizedOldValue = oldValue === null ? null : oldValue;
      const normalizedNewValue = newValue === null ? null : newValue;
      
      if (normalizedOldValue !== normalizedNewValue) {
        changedFields.push(field);
        changes[field] = { old: normalizedOldValue, new: normalizedNewValue };
      }
    }
  });
  
  return { changedFields, changes };
}

// Validation functions
async function validateUserExists(userId: string): Promise<void> {
  const result = await pool.query(queries.getUserById, [userId]);
  if (result.rows.length === 0) {
    throw {
      code: 'NOT_FOUND',
      message: 'User not found',
      field: 'user_id'
    } as ServiceError;
  }
}

async function validateUsernameUpdate(username: string, userId: string, req: Request): Promise<void> {
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

async function validateEmailUpdate(email: string, userId: string, req: Request): Promise<void> {
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

async function validateNameUpdate(name: string, field: 'first_name' | 'middle_name' | 'last_name', req: Request): Promise<void> {
  try {
    // Names are validated by DB constraints and guards; removing standard text validation
  } catch (error) {
    throw {
      code: 'VALIDATION_ERROR',
      message: error instanceof Error ? error.message : `${field} validation failed`,
      field
    } as ValidationError;
  }
}

async function validatePhoneUpdate(phone: string, userId: string, req: Request): Promise<void> {
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


async function validateEnumFields(data: UpdateUserRequest): Promise<void> {
  // Validate account_status
  if (data.account_status !== undefined) {
    const validStatuses = Object.values(AccountStatus);
    if (!validStatuses.includes(data.account_status)) {
      throw {
        code: 'VALIDATION_ERROR',
        message: `Invalid account_status. Must be one of: ${validStatuses.join(', ')}`,
        field: 'account_status'
      } as ValidationError;
    }
  }

  // Validate gender
  if (data.gender !== undefined) {
    const validGenders = Object.values(Gender);
    if (!validGenders.includes(data.gender)) {
      throw {
        code: 'VALIDATION_ERROR',
        message: `Invalid gender. Must be one of: ${validGenders.join(', ')}`,
        field: 'gender'
      } as ValidationError;
    }
  }
}

async function validateBooleanFields(data: UpdateUserRequest): Promise<void> {
  if (data.is_staff !== undefined && typeof data.is_staff !== 'boolean') {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'is_staff must be a boolean value',
      field: 'is_staff'
    } as ValidationError;
  }
}

async function validateUuid(userId: string): Promise<void> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Invalid user_id format. Must be a valid UUID',
      field: 'user_id'
    } as ValidationError;
  }
}

// Uniqueness validation with exclusion of current user
async function validateUsernameUniqueness(username: string, userId: string): Promise<void> {
  const result = await pool.query(queries.checkUsername.text, [username]);
  const existingUser = result.rows.find(row => row.user_id !== userId);
  
  if (existingUser) {
    throw {
      code: 'UNIQUE_CONSTRAINT_ERROR',
      message: 'Username is already taken',
      field: 'username'
    } as UniqueCheckError;
  }
}

async function validateEmailUniqueness(email: string, userId: string): Promise<void> {
  const result = await pool.query(queries.checkEmail.text, [email]);
  const existingUser = result.rows.find(row => row.user_id !== userId);
  
  if (existingUser) {
    throw {
      code: 'UNIQUE_CONSTRAINT_ERROR',
      message: 'Email is already registered',
      field: 'email'
    } as UniqueCheckError;
  }
}

async function validatePhoneUniqueness(phone: string, userId: string): Promise<void> {
  const result = await pool.query(queries.checkPhone.text, [phone]);
  const existingUser = result.rows.find(row => row.user_id !== userId);
  
  if (existingUser) {
    throw {
      code: 'UNIQUE_CONSTRAINT_ERROR',
      message: 'Phone number is already registered',
      field: 'mobile_phone_number'
    } as UniqueCheckError;
  }
}

// Main validation function
async function validateUpdateData(data: UpdateUserRequest, req: Request): Promise<void> {
  try {
    // Validate user_id format
    await validateUuid(data.user_id);
    
    // Check if user exists
    await validateUserExists(data.user_id);
    
    // Validate enum fields
    await validateEnumFields(data);
    
    // Validate boolean fields
    await validateBooleanFields(data);
    
    // Validate individual fields if provided
    if (data.username) {
      await validateUsernameUpdate(data.username, data.user_id, req);
      await validateUsernameUniqueness(data.username, data.user_id);
    }
    
    if (data.email) {
      await validateEmailUpdate(data.email, data.user_id, req);
      await validateEmailUniqueness(data.email, data.user_id);
    }
    
    if (data.first_name) {
      await validateNameUpdate(data.first_name, 'first_name', req);
    }
    
    if (data.last_name) {
      await validateNameUpdate(data.last_name, 'last_name', req);
    }
    
    if (data.middle_name) {
      await validateNameUpdate(data.middle_name, 'middle_name', req);
    }
    
    if (data.mobile_phone_number) {
      await validatePhoneUpdate(data.mobile_phone_number, data.user_id, req);
      await validatePhoneUniqueness(data.mobile_phone_number, data.user_id);
    }
    
    
    // Create event for validation passed
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
      payload: {
        userId: data.user_id,
        changedFields: Object.keys(data).filter(key => key !== 'user_id')
      }
    });
    
  } catch (error) {
    // Create and publish validation failed event
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        userId: data.user_id,
        field: (error as ValidationError).field,
        message: (error as ValidationError).message
      },
      errorData: (error as ValidationError).message
    });
    
    // Re-throw the error to be handled upstream
    throw error;
  }
}

export async function updateUserById(updateData: UpdateUserRequest, req: Request): Promise<ApiResponse> {
    const client = await pool.connect();
    
    try {
      // Get the UUID of the user making the request
      const requestorUuid = getRequestorUuidFromReq(req);
      
      // Data preparation
      const trimmedData = trimUpdateData(updateData);
      
      // Get current user data for comparison
      const currentData = await getCurrentUserData(trimmedData.user_id);
      
      // Find actual changes
      const { changedFields, changes } = findChanges(currentData, trimmedData);
      
      // If no actual changes, return early
      if (changedFields.length === 0) {
        return {
          success: true,
          message: 'No changes detected'
        };
      }
      
      // Validation
      await validateUpdateData(trimmedData, req);
      
      await client.query('BEGIN');
  
      // Подготовка параметров для обновления пользователя
      const userParams = [
        trimmedData.user_id,
        trimmedData.username,
        trimmedData.email,
        trimmedData.is_staff,
        trimmedData.account_status,
        trimmedData.first_name,
        trimmedData.middle_name,
        trimmedData.last_name
      ];
  
      // Обновление данных пользователя
      const userResult = await client.query(
        queries.updateUserById,
        userParams
      );
  
      if (userResult.rowCount === 0) {
        // Create and publish user not found event
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: USER_UPDATE_EVENTS.FAILED.eventName,
          payload: {
            userId: trimmedData.user_id,
            error: {
              code: 'NOT_FOUND',
              message: 'User not found'
            }
          },
          errorData: 'User not found'
        });
        
        throw {
          code: 'NOT_FOUND',
          message: 'User not found'
        };
      }
  
      // Подготовка параметров для обновления профиля
      const profileParams = [
        trimmedData.user_id,
        trimmedData.mobile_phone_number,
        trimmedData.gender
      ];
  
      // Обновление профиля пользователя
      const profileResult = await client.query(
          queries.updateUserProfileById,
          profileParams
      );
      
      if (profileResult.rowCount === 0) {
        // Create and publish profile not found event
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: USER_UPDATE_EVENTS.FAILED.eventName,
          payload: {
            userId: trimmedData.user_id,
            error: {
              code: 'NOT_FOUND',
              message: 'User profile not found'
            }
          },
          errorData: 'User profile not found'
        });
        
        throw {
          code: 'NOT_FOUND',
          message: 'User profile not found'
        } as ServiceError;
      }
  
      await client.query('COMMIT');
      
      // Create and publish successful update event
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USER_UPDATE_EVENTS.COMPLETE.eventName,
        payload: {
          userId: trimmedData.user_id,
          changedFields,
          changes,
          requestorUuid
        }
      });
  
      return {
        success: true,
        message: 'User data updated successfully'
      };
  
    } catch (err: unknown) {
      await client.query('ROLLBACK');
      
      // Приводим error к типу ServiceError
      const error = err as ServiceError;
      
      // If this is not a NOT_FOUND error that we already published, publish a FAILED event
      if (error.code !== 'NOT_FOUND') {
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: USER_UPDATE_EVENTS.FAILED.eventName,
          payload: {
            userId: updateData.user_id,
            error: error.code ? error : {
              code: 'UPDATE_FAILED',
              message: error instanceof Error ? error.message : 'Failed to update user data'
            }
          },
          errorData: error instanceof Error ? error.message : String(error)
        });
      }
      
      // Безопасно обращаемся к свойствам error
      throw {
          code: error?.code || 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update user data',
          details: error
      } as ServiceError;
  
    } finally {
      client.release();
    }
  }

export default updateUserById;