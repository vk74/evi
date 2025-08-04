/**
 * @file get.user.account.status.ts
 * BACKEND Helper for retrieving user account status by UUID from database
 * 
 * Functionality:
 * - Gets user account status from cache or database by user UUID
 * - Caches results to reduce database load
 * - Performs error handling and logging
 * - Returns standardized status values
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { GET_USER_ACCOUNT_STATUS_EVENTS } from './events.helpers';
import { get, set, CacheKeys } from './cache.helpers';

// Type assertion for pool
const pool = pgPool as Pool;



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
    // Log start of account status retrieval
    await createAndPublishEvent({
      eventName: GET_USER_ACCOUNT_STATUS_EVENTS.START.eventName,
      payload: { userId }
    });

    // Try to get result from cache first
    const cacheKey = CacheKeys.forUserStatus(userId);
    const cachedStatus = get<string | null>(cacheKey);
    
    if (cachedStatus !== undefined) {
      // Log cache hit
      await createAndPublishEvent({
        eventName: GET_USER_ACCOUNT_STATUS_EVENTS.SUCCESS_CACHE.eventName,
        payload: { userId, accountStatus: cachedStatus, source: 'cache' }
      });
      return cachedStatus;
    }

    // Query to get account status
    const query = {
      text: 'SELECT account_status FROM app.users WHERE user_id = $1',
      values: [userId]
    };

    const result: QueryResult = await pool.query(query);
    
    if (!result.rows || result.rows.length === 0) {
      // Log user not found
      await createAndPublishEvent({
        eventName: GET_USER_ACCOUNT_STATUS_EVENTS.NOT_FOUND.eventName,
        payload: { userId }
      });
      
      // Cache the null result
      set(cacheKey, null);
      return null;
    }
    
    const accountStatus = result.rows[0].account_status;
    
    // Cache the result
    set(cacheKey, accountStatus);
    
    // Log successful retrieval from database
    await createAndPublishEvent({
      eventName: GET_USER_ACCOUNT_STATUS_EVENTS.SUCCESS_DB.eventName,
      payload: { userId, accountStatus, source: 'database' }
    });

    return accountStatus;
  } catch (error) {
    // Log error during account status retrieval
    await createAndPublishEvent({
      eventName: GET_USER_ACCOUNT_STATUS_EVENTS.ERROR.eventName,
      payload: { userId, error: error instanceof Error ? error.message : String(error) },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    const accountStatusError: AccountStatusError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to get user account status',
      details: { userId, error }
    };
    throw accountStatusError;
  }
}

export default getUserAccountStatus;