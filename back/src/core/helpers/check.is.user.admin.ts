/**
 * @file check.is.user.admin.ts
 * BACKEND Helper for checking if a user is an administrator
 * 
 * Functionality:
 * - Checks if a user is a member of the "administrators" group
 * - Uses get.uuid.by.group.name.ts helper to get the group UUID
 * - Performs error handling and logging
 * - Returns boolean result
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../db/maindb';
import { createSystemLogger, Logger } from '../logger/logger.index';
import { Events } from '../logger/codes';
import { getUuidByGroupName } from './get.uuid.by.group.name';

// Type assertion for pool
const pool = pgPool as Pool;

// Create logger for helper
const logger: Logger = createSystemLogger({
  module: 'UserAdminCheckHelper',
  fileName: 'check.is.user.admin.ts'
});

// Interface for potential errors
interface AdminCheckError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Check if a user is an administrator (member of administrators group)
 * @param userId UUID of the user to check
 * @returns Promise resolving to boolean indicating if user is an administrator
 * @throws AdminCheckError on database errors
 */
export async function checkIsUserAdmin(userId: string): Promise<boolean> {
  try {
    logger.info({
      code: Events.CORE.HELPERS.CHECK_IS_USER_ADMIN.PROCESS.START.code,
      message: `Checking if user ${userId} is an administrator`,
      details: { userId }
    });

    // Get administrators group UUID using the helper
    const administratorsGroupName = 'administrators';
    const groupId = await getUuidByGroupName(administratorsGroupName);

    // If administrators group not found
    if (!groupId) {
      logger.warn({
        code: Events.CORE.HELPERS.CHECK_IS_USER_ADMIN.PROCESS.GROUP_NOT_FOUND.code,
        message: 'Administrators group not found in the system',
        details: { administratorsGroupName }
      });
      return false;
    }

    // Query to check if user is a member of the administrators group
    const query = {
      text: `
        SELECT 1 
        FROM app.group_members 
        WHERE group_id = $1 
        AND user_id = $2 
        AND is_active = true
        LIMIT 1
      `,
      values: [groupId, userId]
    };

    const result: QueryResult = await pool.query(query);
    
    // Check if user is a member of the administrators group
    const isAdmin = result.rowCount !== null && result.rowCount > 0;
    
    if (isAdmin) {
      logger.info({
        code: Events.CORE.HELPERS.CHECK_IS_USER_ADMIN.PROCESS.USER_IS_ADMIN.code,
        message: `User ${userId} is an administrator`,
        details: { userId, groupId }
      });
    } else {
      logger.info({
        code: Events.CORE.HELPERS.CHECK_IS_USER_ADMIN.PROCESS.USER_NOT_ADMIN.code,
        message: `User ${userId} is not an administrator`,
        details: { userId, groupId }
      });
    }
    
    logger.info({
      code: Events.CORE.HELPERS.CHECK_IS_USER_ADMIN.PROCESS.SUCCESS.code,
      message: `Completed admin status check for user ${userId}`,
      details: { userId, isAdmin }
    });

    return isAdmin;
  } catch (error) {
    logger.error({
      code: Events.CORE.HELPERS.CHECK_IS_USER_ADMIN.PROCESS.ERROR.code,
      message: `Error checking admin status for user: ${userId}`,
      error,
      details: {
        userId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    const adminCheckError: AdminCheckError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to check user admin status',
      details: { userId, error }
    };
    throw adminCheckError;
  }
}

export default checkIsUserAdmin;