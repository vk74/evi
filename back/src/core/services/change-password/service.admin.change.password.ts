/**
 * service.admin.change.password.ts - version 1.0.02
 * BACKEND service for admin password reset operations
 * 
 * Handles admin requests to reset user passwords with proper validation and security measures
 * File: service.admin.change.password.ts
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { pool as pgPool } from '../../db/maindb';
import { AdminResetPasswordRequest, ChangePasswordResponse } from './types.change.password';
import { cleanupAllUserTokens } from './service.token.cleanup';
import { getSetting } from '../../../modules/admin/settings/cache.settings';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { ADMIN_PASSWORD_RESET_EVENTS } from './events.change.password';

// SQL queries with correct schema reference
const passwordQueries = {
  getUserPasswordByUuid: `
    SELECT hashed_password, username
    FROM app.users
    WHERE user_id = $1
  `,

  updatePasswordByUuid: `
    UPDATE app.users
    SET hashed_password = $1
    WHERE user_id = $2
    RETURNING user_id, username
  `,

  checkUserExists: `
    SELECT EXISTS (
      SELECT 1 FROM app.users 
      WHERE user_id = $1
    ) as exists
  `,

  validateUserIdentity: `
    SELECT EXISTS (
      SELECT 1 FROM app.users 
      WHERE user_id = $1 AND username = $2
    ) as exists
  `
};

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Password validation using dynamic settings from cache
 * @param {string} password - Password to validate
 * @param {string} username - Username for logging context
 * @returns {Promise<void>} Throws error if validation fails
 */
async function validatePassword(password: string, username: string): Promise<void> {
  await createAndPublishEvent({
    eventName: ADMIN_PASSWORD_RESET_EVENTS.PASSWORD_POLICY_VALIDATION_STARTED.eventName,
    payload: {
      username
    }
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
      eventName: ADMIN_PASSWORD_RESET_EVENTS.PASSWORD_POLICY_SETTINGS_NOT_FOUND.eventName,
      payload: {
        username
      }
    });
    throw new Error('Password policy settings not found. Please contact the system administrator.');
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
      eventName: ADMIN_PASSWORD_RESET_EVENTS.PASSWORD_POLICY_VALIDATION_FAILED.eventName,
      payload: {
        username,
        violations: policyViolations
      }
    });
    throw new Error('Password does not meet account security policies');
  }

  await createAndPublishEvent({
    eventName: ADMIN_PASSWORD_RESET_EVENTS.PASSWORD_POLICY_VALIDATION_PASSED.eventName,
    payload: {
      username
    }
  });
}

/**
 * Reset user password (admin function)
 * @param {AdminResetPasswordRequest} data - Request data containing user info and new password
 * @returns {Promise<ChangePasswordResponse>} Result of the operation
 */
export async function resetPassword(data: AdminResetPasswordRequest): Promise<ChangePasswordResponse> {
  const { uuid, username, newPassword } = data;

  // Log the operation start
  await createAndPublishEvent({
    eventName: ADMIN_PASSWORD_RESET_EVENTS.PASSWORD_RESET_STARTED.eventName,
    payload: {
      username,
      uuid
    }
  });

  // Validate required fields
  if (!uuid || !username || !newPassword) {
    await createAndPublishEvent({
      eventName: ADMIN_PASSWORD_RESET_EVENTS.MISSING_REQUIRED_FIELDS.eventName,
      payload: {
        requestInfo: {
          hasUuid: !!uuid,
          hasUsername: !!username,
          hasNewPassword: !!newPassword
        }
      }
    });
    return {
      success: false,
      message: 'User ID, username and new password are required'
    };
  }

  // Validate new password using dynamic policy
  try {
    await validatePassword(newPassword, username);
  } catch (error) {
    await createAndPublishEvent({
      eventName: ADMIN_PASSWORD_RESET_EVENTS.PASSWORD_VALIDATION_ERROR.eventName,
      payload: {
        username,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Password validation failed'
    };
  }

  // Start database transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await createAndPublishEvent({
      eventName: ADMIN_PASSWORD_RESET_EVENTS.DATABASE_TRANSACTION_STARTED.eventName,
      payload: {
        username
      }
    });

    // Verify user exists and username matches UUID
    const userExistsResult = await client.query(
      passwordQueries.validateUserIdentity,
      [uuid, username]
    );

    // Type casting for exists property
    const exists = userExistsResult.rows[0]?.exists as boolean;
    if (!exists) {
      await createAndPublishEvent({
        eventName: ADMIN_PASSWORD_RESET_EVENTS.USER_NOT_FOUND_OR_MISMATCH.eventName,
        payload: {
          username,
          uuid
        }
      });
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'User not found or username mismatch'
      };
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    await createAndPublishEvent({
      eventName: ADMIN_PASSWORD_RESET_EVENTS.PASSWORD_HASHED_SUCCESSFULLY.eventName,
      payload: {
        username,
        uuid
      }
    });

    // Update the password in the database
    const updateResult = await client.query(
      passwordQueries.updatePasswordByUuid,
      [hashedNewPassword, uuid]
    );

    if (updateResult.rows.length === 0) {
      await createAndPublishEvent({
        eventName: ADMIN_PASSWORD_RESET_EVENTS.DATABASE_UPDATE_ERROR.eventName,
        payload: {
          username,
          uuid
        }
      });
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Failed to update password'
      };
    }

    // Clean up ALL refresh tokens for the user
    await createAndPublishEvent({
      eventName: ADMIN_PASSWORD_RESET_EVENTS.TOKEN_CLEANUP_STARTED.eventName,
      payload: {
        username,
        uuid
      }
    });
    try {
      await cleanupAllUserTokens(uuid);
      await createAndPublishEvent({
        eventName: ADMIN_PASSWORD_RESET_EVENTS.TOKEN_CLEANUP_COMPLETED.eventName,
        payload: {
          username,
          uuid
        }
      });
    } catch (error) {
      await createAndPublishEvent({
        eventName: ADMIN_PASSWORD_RESET_EVENTS.TOKEN_CLEANUP_ERROR.eventName,
        payload: {
          username,
          uuid,
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        errorData: error instanceof Error ? error.message : undefined
      });
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Password reset failed due to token cleanup error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Commit transaction
    await client.query('COMMIT');
    await createAndPublishEvent({
      eventName: ADMIN_PASSWORD_RESET_EVENTS.PASSWORD_RESET_SUCCESSFUL.eventName,
      payload: {
        username,
        uuid
      }
    });
    
    return {
      success: true,
      message: 'Password has been successfully reset'
    };

  } catch (error) {
    await createAndPublishEvent({
      eventName: ADMIN_PASSWORD_RESET_EVENTS.SERVICE_ERROR.eventName,
      payload: {
        username,
        uuid,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      errorData: error instanceof Error ? error.message : undefined
    });
    await client.query('ROLLBACK');
    return {
      success: false,
      message: 'An internal server error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    client.release();
  }
}

export default resetPassword;