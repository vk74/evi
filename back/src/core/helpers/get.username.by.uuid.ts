/**
 * @file get.username.by.uuid.ts
 * BACKEND Helper for retrieving username by user UUID
 * 
 * Functionality:
 * - Gets username from cache or database by user UUID
 * - Caches results to reduce database load
 * - Performs error handling and logging
 * - Returns username or null if user not found
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { GET_USERNAME_BY_UUID_EVENTS } from './events.helpers';
import { get, set, CacheKeys } from './cache.helpers';

// Type assertion for pool
const pool = pgPool as Pool;



// Interface for potential errors
interface GetUsernameError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Fetch username by user UUID
 * @param uuid UUID of the user
 * @returns Promise resolving to username string or null if user not found
 * @throws GetUsernameError on database errors
 */
export async function fetchUsernameByUuid(uuid: string): Promise<string | null> {
  try {
    // Log start of username retrieval
    await createAndPublishEvent({
      eventName: GET_USERNAME_BY_UUID_EVENTS.START.eventName,
      payload: { uuid }
    });

    // Try to get result from cache first
    const cacheKey = CacheKeys.forUserName(uuid);
    const cachedUsername = get<string | null>(cacheKey);
    
    if (cachedUsername !== undefined) {
      // Log cache hit
      await createAndPublishEvent({
        eventName: GET_USERNAME_BY_UUID_EVENTS.SUCCESS_CACHE.eventName,
        payload: { uuid, username: cachedUsername, source: 'cache' }
      });
      return cachedUsername;
    }

    // Query to get username
    const query = {
      text: 'SELECT username FROM app.users WHERE user_id = $1 LIMIT 1',
      values: [uuid]
    };

    const result: QueryResult = await pool.query(query);
    
    if (!result.rows || result.rows.length === 0) {
      // Log user not found
      await createAndPublishEvent({
        eventName: GET_USERNAME_BY_UUID_EVENTS.NOT_FOUND.eventName,
        payload: { uuid }
      });
      
      // Cache the null result
      set(cacheKey, null);
      return null;
    }
    
    const username = result.rows[0].username;
    
    // Cache the result
    set(cacheKey, username);
    
    // Log successful retrieval from database
    await createAndPublishEvent({
      eventName: GET_USERNAME_BY_UUID_EVENTS.SUCCESS_DB.eventName,
      payload: { uuid, username, source: 'database' }
    });

    return username;
  } catch (error) {
    // Log error during username retrieval
    await createAndPublishEvent({
      eventName: GET_USERNAME_BY_UUID_EVENTS.ERROR.eventName,
      payload: { uuid, error: error instanceof Error ? error.message : String(error) },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    const getUsernameError: GetUsernameError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch username',
      details: { uuid, error }
    };
    throw getUsernameError;
  }
}

export default fetchUsernameByUuid;