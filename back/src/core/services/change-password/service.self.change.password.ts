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
      console.log(`[Self Change Password Service] Failed: User not found: ${username} (${uuid})`);
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
      console.log(`[Self Change Password Service] Failed: Username mismatch for UUID: ${uuid}`);
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
      console.log(`[Self Change Password Service] Failed: Invalid current password for user: ${username} (${uuid})`);
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
      console.log(`[Self Change Password Service] Failed: Database update error for user: ${username} (${uuid})`);
      await client.query('ROLLBACK');
      return {
        success: false,
        message: 'Failed to update password'
      };
    }

    // Clean up refresh tokens if device fingerprint is provided
    if (deviceFingerprint) {
      console.log('[Self Change Password Service] Device fingerprint provided, cleaning up tokens...');
      try {
        await cleanupUserTokens(uuid, deviceFingerprint);
        console.log('[Self Change Password Service] Token cleanup completed successfully');
      } catch (error) {
        console.error('[Self Change Password Service] Error during token cleanup:', error);
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'Password change failed due to token cleanup error',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } else {
      console.log('[Self Change Password Service] No device fingerprint provided, skipping token cleanup');
    }

    // Commit transaction
    await client.query('COMMIT');
    console.log(`[Self Change Password Service] Password successfully changed for user: ${username} (${uuid})`);
    
    return {
      success: true,
      message: 'Password has been successfully changed'
    };

  } catch (error) {
    console.error('[Self Change Password Service] Error:', error);
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