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
import { pool as pgPool } from '../../db/maindb';
import { createSystemLogger, Logger } from '../logger/logger.index';
import { Events } from '../logger/codes';
import { get, set, CacheKeys } from './cache.helpers';

// Type assertion for pool
const pool = pgPool as Pool;

// Create logger for helper
const logger: Logger = createSystemLogger({
  module: 'UsernameByUuidHelper',
  fileName: 'get.username.by.uuid.ts'
});

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
    logger.info({
      code: Events.CORE.HELPERS.GET_USERNAME_BY_UUID.PROCESS.START.code,
      message: `Fetching username for user: ${uuid}`,
      details: { uuid }
    });

    // Try to get result from cache first
    const cacheKey = CacheKeys.forUserName(uuid);
    const cachedUsername = get<string | null>(cacheKey);
    
    if (cachedUsername !== undefined) {
      logger.debug({
        code: Events.CORE.HELPERS.GET_USERNAME_BY_UUID.PROCESS.SUCCESS.code,
        message: `Retrieved username for user ${uuid} from cache`,
        details: { uuid, username: cachedUsername, source: 'cache' }
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
      logger.warn({
        code: Events.CORE.HELPERS.GET_USERNAME_BY_UUID.PROCESS.NOT_FOUND.code,
        message: `User not found with UUID: ${uuid}`,
        details: { uuid }
      });
      
      // Cache the null result
      set(cacheKey, null);
      return null;
    }
    
    const username = result.rows[0].username;
    
    // Cache the result
    set(cacheKey, username);
    
    logger.info({
      code: Events.CORE.HELPERS.GET_USERNAME_BY_UUID.PROCESS.SUCCESS.code,
      message: `Retrieved username [${username}] for UUID: ${uuid}`,
      details: { uuid, username, source: 'database' }
    });

    return username;
  } catch (error) {
    logger.error({
      code: Events.CORE.HELPERS.GET_USERNAME_BY_UUID.PROCESS.ERROR.code,
      message: `Error fetching username for user: ${uuid}`,
      error,
      details: {
        uuid,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
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