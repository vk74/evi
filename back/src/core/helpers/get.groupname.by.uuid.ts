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
import { createSystemLgr, Lgr } from '../lgr/lgr.index';
import { Events } from '../lgr/codes';
import { get, set, CacheKeys } from './cache.helpers';

// Type assertion for pool
const pool = pgPool as Pool;

// Create lgr for helper
const lgr: Lgr = createSystemLgr({
  module: 'GroupnameByUuidHelper',
  fileName: 'get.groupname.by.uuid.ts'
});

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
    lgr.info({
      code: Events.CORE.HELPERS.GET_USERNAME_BY_UUID.PROCESS.START.code,
      message: `Fetching group name for group: ${uuid}`,
      details: { uuid }
    });

    // Try to get result from cache first
    const cacheKey = CacheKeys.forGroupName(uuid);
    const cachedGroupname = get<string | null>(cacheKey);
    
    if (cachedGroupname !== undefined) {
      lgr.debug({
        code: Events.CORE.HELPERS.GET_USERNAME_BY_UUID.PROCESS.SUCCESS.code,
        message: `Retrieved group name for group ${uuid} from cache`,
        details: { uuid, groupname: cachedGroupname, source: 'cache' }
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
      lgr.warn({
        code: Events.CORE.HELPERS.GET_USERNAME_BY_UUID.PROCESS.NOT_FOUND.code,
        message: `Group not found with UUID: ${uuid}`,
        details: { uuid }
      });
      
      // Cache the null result
      set(cacheKey, null);
      return null;
    }
    
    const groupname = result.rows[0].name;
    
    // Cache the result
    set(cacheKey, groupname);
    
    lgr.info({
      code: Events.CORE.HELPERS.GET_USERNAME_BY_UUID.PROCESS.SUCCESS.code,
      message: `Retrieved group name [${groupname}] for UUID: ${uuid}`,
      details: { uuid, groupname, source: 'database' }
    });

    return groupname;
  } catch (error) {
    lgr.error({
      code: Events.CORE.HELPERS.GET_USERNAME_BY_UUID.PROCESS.ERROR.code,
      message: `Error fetching group name for group: ${uuid}`,
      error,
      details: {
        uuid,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
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