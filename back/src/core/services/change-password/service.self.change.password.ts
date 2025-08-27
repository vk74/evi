/**
 * service.self.change.password.ts
 * BACKEND service for handling user self password change operations.
 * Contains business logic for validating and updating passwords.
 */

import bcrypt from 'bcrypt';
import { pool } from '../../db/maindb';
import { passwordChangeQueries } from './queries.change.password';
import { SelfChangePasswordRequest, ChangePasswordResponse } from './types.change.password';
import { getSetting } from '../../../modules/admin/settings/cache.settings';
import { cleanupUserTokens } from './service.token.cleanup';
import { createAndPublishEvent } from '@/core/eventBus/fabric.events';
import { SELF_PASSWORD_CHANGE_EVENTS } from './events.change.password';

/**
 * Password validation using dynamic settings from cache
 * @param {string} password - Password to validate
 * @param {string} username - Username for logging context
 * @returns {Promise<void>} Throws error if validation fails
 */
async function validatePassword(password: string, username: string): Promise<void> {
  console.log(`[Self Change Password Service] Starting password policy validation for user: ${username}`);

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
    console.log(`[Self Change Password Service] Failed: Password policy settings not found in cache for user: ${username}`);
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
    console.log(`[Self Change Password Service] Failed: Password policy validation failed for user: ${username}. Violations: ${policyViolations.join(', ')}`);
    throw new Error('Password does not meet account security policies');
  }

  console.log(`[Self Change Password Service] Password policy validation passed for user: ${username}`);
}

/**
 * Change user's own password
 * @param {SelfChangePasswordRequest} data - Request data containing user credentials and passwords
 * @returns {Promise<ChangePasswordResponse>} Result of the operation
 */
export async function changePassword(data: SelfChangePasswordRequest): Promise<ChangePasswordResponse> {
  const { uuid, username, currentPassword, newPassword, deviceFingerprint } = data;

  // Log the operation start
  console.log(`[Self Change Password Service] Starting password change for user: ${username} (${uuid})`);

  // Validate required fields
  if (!uuid || !username || !currentPassword || !newPassword) {
    console.log('[Self Change Password Service] Failed: Missing required fields');
    return {
      success: false,
      message: 'User ID, username, current password and new password are required'
    };
  }

  // Validate new password using dynamic settings from cache
  try {
    await validatePassword(newPassword, username);
  } catch (error) {
    console.log(`[Self Change Password Service] Failed: Password validation error for user: ${username}`);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Password validation failed'
    };
  }

  // Start database transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('[Self Change Password Service] Database transaction started');

    // Get current password hash for verification
    const userResult = await client.query(
      passwordChangeQueries.getUserPasswordByUuid,
      [uuid]
    );

    if (userResult.rows.length === 0) {
      await createAndPublishEvent({
        eventName: SELF_PASSWORD_CHANGE_EVENTS.USER_NOT_FOUND.eventName,
        payload: {
          username,
          uuid
        }
      });
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Verify username from database matches request
    // Using type casting to handle typings for database results
    const dbUsername = userResult.rows[0]?.username as string;
    if (dbUsername !== username) {
      await createAndPublishEvent({
        eventName: SELF_PASSWORD_CHANGE_EVENTS.USERNAME_MISMATCH.eventName,
        payload: {
          username,
          uuid
        }
      });
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'User identity verification failed'
      };
    }

    // Verify current password
    const hashedCurrentPassword = userResult.rows[0]?.hashed_password as string;
    const isMatch = await bcrypt.compare(currentPassword, hashedCurrentPassword);

    if (!isMatch) {
      await createAndPublishEvent({
        eventName: SELF_PASSWORD_CHANGE_EVENTS.INVALID_CURRENT_PASSWORD.eventName,
        payload: {
          username,
          uuid
        }
      });
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Current password is incorrect'
      };
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update the password in the database
    const updateResult = await client.query(
      passwordChangeQueries.updatePasswordByUuid,
      [hashedNewPassword, uuid]
    );

    if (updateResult.rows.length === 0) {
      await createAndPublishEvent({
        eventName: SELF_PASSWORD_CHANGE_EVENTS.DATABASE_UPDATE_ERROR.eventName,
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

    // Clean up refresh tokens if device fingerprint is provided
    if (deviceFingerprint) {
      await createAndPublishEvent({
        eventName: SELF_PASSWORD_CHANGE_EVENTS.DEVICE_FINGERPRINT_PROVIDED.eventName,
        payload: {
          username,
          uuid
        }
      });
      try {
        await cleanupUserTokens(uuid, deviceFingerprint);
        await createAndPublishEvent({
          eventName: SELF_PASSWORD_CHANGE_EVENTS.TOKEN_CLEANUP_COMPLETED.eventName,
          payload: {
            username,
            uuid
          }
        });
      } catch (error) {
        await createAndPublishEvent({
          eventName: SELF_PASSWORD_CHANGE_EVENTS.TOKEN_CLEANUP_ERROR.eventName,
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
          message: 'Password change failed due to token cleanup error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      await createAndPublishEvent({
        eventName: SELF_PASSWORD_CHANGE_EVENTS.NO_DEVICE_FINGERPRINT_PROVIDED.eventName,
        payload: {
          username,
          uuid
        }
      });
    }

    // Commit transaction
    await client.query('COMMIT');
    await createAndPublishEvent({
      eventName: SELF_PASSWORD_CHANGE_EVENTS.PASSWORD_CHANGE_SUCCESSFUL.eventName,
      payload: {
        username,
        uuid
      }
    });
    
    return {
      success: true,
      message: 'Password has been successfully changed'
    };

  } catch (error) {
    await createAndPublishEvent({
      eventName: SELF_PASSWORD_CHANGE_EVENTS.SERVICE_ERROR.eventName,
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

export default changePassword;