/**
 * @file get.groupname.by.uuid.ts
 * BACKEND Helper for retrieving group name by group UUID
 * 
 * Functionality:
 * - Gets group name from cache or database by group UUID
 * - Caches results to reduce database load
 * - Performs error handling and logging
 * - Returns group name or null if group not found
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { GET_GROUPNAME_BY_UUID_EVENTS } from './events.helpers';
import { get, set, CacheKeys } from './cache.helpers';

// Type assertion for pool
const pool = pgPool as Pool;



// Interface for potential errors
interface GetGroupnameError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Fetch group name by group UUID
 * @param uuid UUID of the group
 * @returns Promise resolving to group name string or null if group not found
 * @throws GetGroupnameError on database errors
 */
export async function fetchGroupnameByUuid(uuid: string): Promise<string | null> {
  try {
    // Log start of group name retrieval
    await createAndPublishEvent({
      eventName: GET_GROUPNAME_BY_UUID_EVENTS.START.eventName,
      payload: { uuid }
    });

    // Try to get result from cache first
    const cacheKey = CacheKeys.forGroupName(uuid);
    const cachedGroupname = get<string | null>(cacheKey);
    
    if (cachedGroupname !== undefined) {
      // Log cache hit
      await createAndPublishEvent({
        eventName: GET_GROUPNAME_BY_UUID_EVENTS.SUCCESS_CACHE.eventName,
        payload: { uuid, groupname: cachedGroupname, source: 'cache' }
      });
      return cachedGroupname;
    }

    // Query to get group name
    const query = {
      text: 'SELECT name FROM app.groups WHERE group_id = $1 LIMIT 1',
      values: [uuid]
    };

    const result: QueryResult = await pool.query(query);
    
    if (!result.rows || result.rows.length === 0) {
      // Log group not found
      await createAndPublishEvent({
        eventName: GET_GROUPNAME_BY_UUID_EVENTS.NOT_FOUND.eventName,
        payload: { uuid }
      });
      
      // Cache the null result
      set(cacheKey, null);
      return null;
    }
    
    const groupname = result.rows[0].name;
    
    // Cache the result
    set(cacheKey, groupname);
    
    // Log successful retrieval from database
    await createAndPublishEvent({
      eventName: GET_GROUPNAME_BY_UUID_EVENTS.SUCCESS_DB.eventName,
      payload: { uuid, groupname, source: 'database' }
    });

    return groupname;
  } catch (error) {
    // Log error during group name retrieval
    await createAndPublishEvent({
      eventName: GET_GROUPNAME_BY_UUID_EVENTS.ERROR.eventName,
      payload: { uuid, error: error instanceof Error ? error.message : String(error) },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    const getGroupnameError: GetGroupnameError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch group name',
      details: { uuid, error }
    };
    throw getGroupnameError;
  }
}

export default fetchGroupnameByUuid; 