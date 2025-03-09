/**
 * service.admin.change.password.ts
 * BACKEND service for handling admin password reset operations.
 * Contains business logic for validating and resetting user passwords.
 */

import bcrypt from 'bcrypt';
import { pool } from '../../../db/maindb';
import { REGEX, VALIDATION } from '../../validation/rules.common.fields';
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

  // Validate new password length
  if (newPassword.length < VALIDATION.PASSWORD.MIN_LENGTH || 
      newPassword.length > VALIDATION.PASSWORD.MAX_LENGTH) {
    console.log('[Admin Reset Password Service] Failed: Invalid password length');
    return {
      success: false,
      message: VALIDATION.PASSWORD.MESSAGES.MIN_LENGTH
    };
  }

  // Check password format
  if (!REGEX.PASSWORD.test(newPassword)) {
    console.log('[Admin Reset Password Service] Failed: Invalid password format');
    return {
      success: false,
      message: VALIDATION.PASSWORD.MESSAGES.INVALID_CHARS
    };
  }

  // Check password contains at least one letter
  if (!REGEX.PASSWORD_CONTAINS_LETTER.test(newPassword)) {
    console.log('[Admin Reset Password Service] Failed: Password missing letter');
    return {
      success: false,
      message: VALIDATION.PASSWORD.MESSAGES.NO_LETTER
    };
  }

  // Check password contains at least one number
  if (!REGEX.PASSWORD_CONTAINS_NUMBER.test(newPassword)) {
    console.log('[Admin Reset Password Service] Failed: Password missing number');
    return {
      success: false,
      message: VALIDATION.PASSWORD.MESSAGES.NO_NUMBER
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