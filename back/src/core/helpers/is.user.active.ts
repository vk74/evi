/**
 * @file is.user.active.ts
 * BACKEND Helper for fast user activity check using optimized is_active field
 * 
 * Functionality:
 * - Gets user activity status from cache or database by user UUID
 * - Uses optimized is_active field for maximum performance
 * - Caches boolean results to reduce database load
 * - Performs error handling and logging
 * - Returns boolean value for guard middleware
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { IS_USER_ACTIVE_EVENTS } from './events.helpers';
import { get, set, CacheKeys } from './cache.helpers';

// Type assertion for pool
const pool = pgPool as Pool;

// Interface for potential errors
interface UserActiveError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Check if user is active by user UUID using optimized is_active field
 * @param userId UUID of the user
 * @returns Boolean indicating if user is active, or null if user not found
 * @throws UserActiveError on database errors
 */
export async function isUserActive(userId: string): Promise<boolean | null> {
  try {
    // Log start of user activity check
    await createAndPublishEvent({
      eventName: IS_USER_ACTIVE_EVENTS.START.eventName,
      payload: { userId }
    });

    // Try to get result from cache first
    const cacheKey = CacheKeys.forUserActive(userId);
    const cachedResult = await get<boolean | null>(cacheKey);
    
    if (cachedResult !== undefined) {
      // Log cache hit
      await createAndPublishEvent({
        eventName: IS_USER_ACTIVE_EVENTS.SUCCESS_CACHE.eventName,
        payload: { userId, isActive: cachedResult, source: 'cache' }
      });
      return cachedResult;
    }

    // Query to get user activity status using optimized field
    const query = {
      text: 'SELECT is_active FROM app.users WHERE user_id = $1',
      values: [userId]
    };

    const result: QueryResult = await pool.query(query);
    
    if (!result.rows || result.rows.length === 0) {
      // Log user not found
      await createAndPublishEvent({
        eventName: IS_USER_ACTIVE_EVENTS.NOT_FOUND.eventName,
        payload: { userId }
      });
      
      // Cache the null result
      await set(cacheKey, null);
      return null;
    }
    
    const isActive = result.rows[0].is_active;
    
    // Cache the result
    await set(cacheKey, isActive);
    
    // Log successful retrieval from database
    await createAndPublishEvent({
      eventName: IS_USER_ACTIVE_EVENTS.SUCCESS_DB.eventName,
      payload: { userId, isActive, source: 'database' }
    });

    return isActive;
  } catch (error) {
    // Log error during user activity check
    await createAndPublishEvent({
      eventName: IS_USER_ACTIVE_EVENTS.ERROR.eventName,
      payload: { userId, error: error instanceof Error ? error.message : String(error) },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    const userActiveError: UserActiveError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to check user activity status',
      details: { userId, error }
    };
    throw userActiveError;
  }
}

export default isUserActive;
