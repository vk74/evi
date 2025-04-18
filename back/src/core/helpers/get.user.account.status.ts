/**
 * get.user.account.status.ts
 * Helper for retrieving user account status by UUID from database
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../db/maindb';
import { createSystemLogger, Logger } from '../logger/logger.index';
import { Events } from '../logger/codes';

// Type assertion for pool
const pool = pgPool as Pool;

// Create logger for helper
const logger: Logger = createSystemLogger({
  module: 'UserAccountStatusHelper',
  fileName: 'get.user.account.status.ts'
});

// Interface for potential errors
interface AccountStatusError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Get user account status by user UUID
 * @param userId UUID of the user
 * @returns Account status string or null if user not found
 * @throws AccountStatusError on database errors
 */
export async function getUserAccountStatus(userId: string): Promise<string | null> {
  try {
    logger.info({
      code: Events.CORE.HELPERS.GET_USER_ACCOUNT_STATUS.PROCESS.START.code,
      message: `Getting user account status for user: ${userId}`,
      details: { userId }
    });

    // Query to get account status
    const query = {
      text: 'SELECT account_status FROM app.users WHERE user_id = $1',
      values: [userId]
    };

    const result: QueryResult = await pool.query(query);
    
    if (!result.rows || result.rows.length === 0) {
      logger.warn({
        code: Events.CORE.HELPERS.GET_USER_ACCOUNT_STATUS.PROCESS.NOT_FOUND.code,
        message: `User not found with UUID: ${userId}`,
        details: { userId }
      });
      return null;
    }

    const accountStatus = result.rows[0].account_status;
    
    logger.info({
      code: Events.CORE.HELPERS.GET_USER_ACCOUNT_STATUS.PROCESS.SUCCESS.code,
      message: `Retrieved account status [${accountStatus}] for user: ${userId}`,
      details: { userId, accountStatus }
    });

    return accountStatus;
  } catch (error) {
    logger.error({
      code: Events.CORE.HELPERS.GET_USER_ACCOUNT_STATUS.PROCESS.ERROR.code,
      message: `Error getting account status for user: ${userId}`,
      error,
      details: {
        userId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });
    
    const accountStatusError: AccountStatusError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to get user account status',
      details: { userId, error }
    };
    throw accountStatusError;
  }
}