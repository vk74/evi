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
import { pool as pgPool } from '../../db/maindb';
import { createSystemLgr, Lgr } from '../lgr/lgr.index';
import { Events } from '../lgr/codes';
import { get, set, CacheKeys } from './cache.helpers';

// Type assertion for pool
const pool = pgPool as Pool;

// Create lgr for helper
const lgr: Lgr = createSystemLgr({
  module: 'GroupUuidHelper',
  fileName: 'get.uuid.by.group.name.ts'
});

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
    lgr.info({
      code: Events.CORE.HELPERS.GET_UUID_BY_GROUP_NAME.PROCESS.START.code,
      message: `Getting group UUID for group: ${groupName}`,
      details: { groupName }
    });

    // Try to get result from cache first
    const cacheKey = CacheKeys.forGroupUuid(groupName);
    const cachedUuid = get<string | null>(cacheKey);
    
    if (cachedUuid !== undefined) {
      lgr.debug({
        code: Events.CORE.HELPERS.GET_UUID_BY_GROUP_NAME.PROCESS.SUCCESS.code,
        message: `Retrieved UUID for group ${groupName} from cache`,
        details: { groupName, groupId: cachedUuid, source: 'cache' }
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
      lgr.warn({
        code: Events.CORE.HELPERS.GET_UUID_BY_GROUP_NAME.PROCESS.NOT_FOUND.code,
        message: `Group not found with name: ${groupName}`,
        details: { groupName }
      });
      
      // Cache the null result
      set(cacheKey, null);
      return null;
    }
    
    const groupId = result.rows[0].group_id;
    
    // Cache the result
    set(cacheKey, groupId);
    
    lgr.info({
      code: Events.CORE.HELPERS.GET_UUID_BY_GROUP_NAME.PROCESS.SUCCESS.code,
      message: `Retrieved UUID [${groupId}] for group: ${groupName}`,
      details: { groupName, groupId, source: 'database' }
    });

    return groupId;
  } catch (error) {
    lgr.error({
      code: Events.CORE.HELPERS.GET_UUID_BY_GROUP_NAME.PROCESS.ERROR.code,
      message: `Error getting UUID for group: ${groupName}`,
      error,
      details: {
        groupName,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
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