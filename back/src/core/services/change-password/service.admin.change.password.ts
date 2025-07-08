/**
 * File: service.admin.change.password.ts  
 * Version: 1.1.0
 * Description: BACKEND service for handling admin password reset operations
 * Purpose: Contains business logic for validating and resetting user passwords with dynamic password policy validation
 * Backend file that manages admin password reset functionality, integrates with settings cache for password policies
 * 
 * The service validates new passwords against dynamic policies from Application.Security.PasswordPolicies settings,
 * verifies user identity, hashes passwords securely, and updates user passwords in the database.
 * Uses settings cache to ensure password policies are consistently applied across the system.
 */

import bcrypt from 'bcrypt';
import { pool } from '../../db/maindb';
import { getSetting } from '../../../modules/admin/settings/cache.settings';
import type { AppSetting } from '../../../modules/admin/settings/types.settings';
import { AdminResetPasswordRequest, ChangePasswordResponse } from './types.change.password';

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

/**
 * Password validation using dynamic settings from cache
 * @param {string} password - Password to validate
 * @param {string} username - Username for logging context
 * @returns {Promise<void>} Throws error if validation fails
 */
async function validatePassword(password: string, username: string): Promise<void> {
  console.log(`[Admin Reset Password Service] Starting password policy validation for user: ${username}`);

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
    console.log(`[Admin Reset Password Service] Failed: Password policy settings not found in cache for user: ${username}`);
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
    console.log(`[Admin Reset Password Service] Failed: Password policy validation failed for user: ${username}. Violations: ${policyViolations.join(', ')}`);
    throw new Error('Password does not meet account security policies');
  }

  console.log(`[Admin Reset Password Service] Password policy validation passed for user: ${username}`);
}

/**
 * Reset user password (admin function)
 * @param {AdminResetPasswordRequest} data - Request data containing user info and new password
 * @returns {Promise<ChangePasswordResponse>} Result of the operation
 */
export async function resetPassword(data: AdminResetPasswordRequest): Promise<ChangePasswordResponse> {
  const { uuid, username, newPassword } = data;

  // Log the operation start
  console.log(`[Admin Reset Password Service] Starting password reset for user: ${username} (${uuid})`);

  // Validate required fields
  if (!uuid || !username || !newPassword) {
    console.log('[Admin Reset Password Service] Failed: Missing required fields');
    return {
      success: false,
      message: 'User ID, username and new password are required'
    };
  }

  // Validate new password using dynamic policy
  try {
    await validatePassword(newPassword, username);
  } catch (error) {
    console.log(`[Admin Reset Password Service] Failed: Password validation error for user: ${username}`);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Password validation failed'
    };
  }

  try {
    // Verify user exists and username matches UUID
    const userExistsResult = await pool.query(
      passwordQueries.validateUserIdentity,
      [uuid, username]
    );

    // Type casting for exists property
    const exists = userExistsResult.rows[0]?.exists as boolean;
    if (!exists) {
      console.log(`[Admin Reset Password Service] Failed: User not found or username mismatch: ${username} (${uuid})`);
      return {
        success: false,
        message: 'User not found or username mismatch'
      };
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    console.log(`[Admin Reset Password Service] Password hashed successfully for user: ${username} (${uuid})`);

    // Update the password in the database
    const updateResult = await pool.query(
      passwordQueries.updatePasswordByUuid,
      [hashedNewPassword, uuid]
    );

    if (updateResult.rows.length > 0) {
      console.log(`[Admin Reset Password Service] Password successfully reset for user: ${username} (${uuid})`);
      return {
        success: true,
        message: 'Password has been successfully reset'
      };
    } else {
      console.log(`[Admin Reset Password Service] Failed: Database update error for user: ${username} (${uuid})`);
      return {
        success: false,
        message: 'Failed to update password'
      };
    }
  } catch (error) {
    console.error('[Admin Reset Password Service] Error:', error);
    return {
      success: false,
      message: 'An internal server error occurred',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default resetPassword;