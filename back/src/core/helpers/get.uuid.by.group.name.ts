/**
 * @file get.uuid.by.group.name.ts
 * BACKEND Helper for retrieving group UUID by its name
 * 
 * Functionality:
 * - Gets group UUID from database by group name
 * - Performs error handling and logging
 * - Returns UUID or null if not found
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../db/maindb';
import { createSystemLogger, Logger } from '../logger/logger.index';
import { Events } from '../logger/codes';

// Type assertion for pool
const pool = pgPool as Pool;

// Create logger for helper
const logger: Logger = createSystemLogger({
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
    logger.info({
      code: Events.CORE.HELPERS.GET_UUID_BY_GROUP_NAME.PROCESS.START.code,
      message: `Getting group UUID for group: ${groupName}`,
      details: { groupName }
    });

    // Query to get group UUID
    const query = {
      text: 'SELECT group_id FROM app.groups WHERE group_name = $1',
      values: [groupName]
    };

    const result: QueryResult = await pool.query(query);
    
    if (!result.rows || result.rows.length === 0) {
      logger.warn({
        code: Events.CORE.HELPERS.GET_UUID_BY_GROUP_NAME.PROCESS.NOT_FOUND.code,
        message: `Group not found with name: ${groupName}`,
        details: { groupName }
      });
      return null;
    }
    
    const groupId = result.rows[0].group_id;
    
    logger.info({
      code: Events.CORE.HELPERS.GET_UUID_BY_GROUP_NAME.PROCESS.SUCCESS.code,
      message: `Retrieved UUID [${groupId}] for group: ${groupName}`,
      details: { groupName, groupId }
    });

    return groupId;
  } catch (error) {
    logger.error({
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