/**
 * service.self.change.password.ts
 * BACKEND service for handling user self password change operations.
 * Contains business logic for validating and updating passwords.
 */

import bcrypt from 'bcrypt';
import { pool } from '../../db/maindb';
import { passwordChangeQueries } from './queries.change.password';
import { SelfChangePasswordRequest, ChangePasswordResponse } from './types.change.password';
import { REGEX, VALIDATION } from '../../validation/rules.common.fields';
import { cleanupUserTokens } from './service.token.cleanup';

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

  // Validate new password length
  if (newPassword.length < VALIDATION.PASSWORD.MIN_LENGTH || 
      newPassword.length > VALIDATION.PASSWORD.MAX_LENGTH) {
    console.log('[Self Change Password Service] Failed: Invalid password length');
    return {
      success: false,
      message: VALIDATION.PASSWORD.MESSAGES.MIN_LENGTH
    };
  }

  // Check password format
  if (!REGEX.PASSWORD.test(newPassword)) {
    console.log('[Self Change Password Service] Failed: Invalid password format');
    return {
      success: false,
      message: VALIDATION.PASSWORD.MESSAGES.INVALID_CHARS
    };
  }

  // Check password contains at least one letter
  if (!REGEX.PASSWORD_CONTAINS_LETTER.test(newPassword)) {
    console.log('[Self Change Password Service] Failed: Password missing letter');
    return {
      success: false,
      message: VALIDATION.PASSWORD.MESSAGES.NO_LETTER
    };
  }

  // Check password contains at least one number
  if (!REGEX.PASSWORD_CONTAINS_NUMBER.test(newPassword)) {
    console.log('[Self Change Password Service] Failed: Password missing number');
    return {
      success: false,
      message: VALIDATION.PASSWORD.MESSAGES.NO_NUMBER
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