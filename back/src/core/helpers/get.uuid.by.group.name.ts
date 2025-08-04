/**
 * @file get.uuid.by.group.name.ts
 * BACKEND Helper for retrieving group UUID by its name
 * 
 * Functionality:
 * - Gets group UUID from cache or database by group name
 * - Caches results to reduce database load
 * - Performs error handling and logging
 * - Returns UUID or null if not found
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { GET_UUID_BY_GROUP_NAME_EVENTS } from './events.helpers';
import { get, set, CacheKeys } from './cache.helpers';

// Type assertion for pool
const pool = pgPool as Pool;



// Interface for potential errors
interface GroupUuidError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Get group UUID by group name
 * @param groupName Name of the group to find
 * @returns UUID string or null if group not found
 * @throws GroupUuidError on database errors
 */
export async function getUuidByGroupName(groupName: string): Promise<string | null> {
  try {
    // Log start of UUID retrieval
    await createAndPublishEvent({
      eventName: GET_UUID_BY_GROUP_NAME_EVENTS.START.eventName,
      payload: { groupName }
    });

    // Try to get result from cache first
    const cacheKey = CacheKeys.forGroupUuid(groupName);
    const cachedUuid = await get<string | null>(cacheKey);
    
    if (cachedUuid !== undefined) {
      // Log cache hit
      await createAndPublishEvent({
        eventName: GET_UUID_BY_GROUP_NAME_EVENTS.SUCCESS_CACHE.eventName,
        payload: { groupName, groupId: cachedUuid, source: 'cache' }
      });
      return cachedUuid;
    }

    // Query to get group UUID
    const query = {
      text: 'SELECT group_id FROM app.groups WHERE group_name = $1',
      values: [groupName]
    };

    const result: QueryResult = await pool.query(query);
    
    if (!result.rows || result.rows.length === 0) {
      // Log group not found
      await createAndPublishEvent({
        eventName: GET_UUID_BY_GROUP_NAME_EVENTS.NOT_FOUND.eventName,
        payload: { groupName }
      });
      
      // Cache the null result
      await set(cacheKey, null);
      return null;
    }
    
    const groupId = result.rows[0].group_id;
    
    // Cache the result
    await set(cacheKey, groupId);
    
    // Log successful retrieval from database
    await createAndPublishEvent({
      eventName: GET_UUID_BY_GROUP_NAME_EVENTS.SUCCESS_DB.eventName,
      payload: { groupName, groupId, source: 'database' }
    });

    return groupId;
  } catch (error) {
    // Log error during UUID retrieval
    await createAndPublishEvent({
      eventName: GET_UUID_BY_GROUP_NAME_EVENTS.ERROR.eventName,
      payload: { groupName, error: error instanceof Error ? error.message : String(error) },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    const groupUuidError: GroupUuidError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to get group UUID',
      details: { groupName, error }
    };
    throw groupUuidError;
  }
}

export default getUuidByGroupName;