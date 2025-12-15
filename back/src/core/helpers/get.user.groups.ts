/**
 * @file get.user.groups.ts
 * Version: 1.1.0
 * BACKEND Helper for retrieving user groups
 * 
 * Functionality:
 * - Gets list of group UUIDs for a user from database
 * - Used for authorization and permission checks
 * 
 * Changes in v1.1.0:
 * - Removed unnecessary START and SUCCESS events, kept only ERROR event for error tracking
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { GET_USER_GROUPS_EVENTS } from './events.helpers';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Fetch group IDs for a user
 * @param userUuid UUID of the user
 * @returns Promise resolving to array of group UUIDs
 */
export async function getUserGroups(userUuid: string): Promise<string[]> {
  try {
    const query = {
      text: 'SELECT group_id FROM app.user_groups WHERE user_id = $1',
      values: [userUuid]
    };

    const result: QueryResult = await pool.query(query);
    
    // Extract group IDs
    const groupIds = result.rows.map(row => row.group_id);

    return groupIds;
  } catch (error) {
    // Log error
    await createAndPublishEvent({
      eventName: GET_USER_GROUPS_EVENTS.ERROR.eventName,
      payload: { 
        userUuid, 
        error: error instanceof Error ? error.message : String(error) 
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    // Rethrow to be handled by caller
    throw error;
  }
}

export default getUserGroups;

