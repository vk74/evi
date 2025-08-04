/**
 * get.uuid.by.username.ts - version 1.0.0
 * BACKEND helper for retrieving user UUID by username
 * 
 * Functionality:
 * - Retrieves user UUID from database based on username
 * - Returns the UUID as a string or null if user not found
 * - Handles database connection and error handling
 * - Used by middleware that needs to identify users
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { GET_UUID_BY_USERNAME_EVENTS } from './events.helpers';

// Type assertion for pool
const pool = pgPool as Pool;

// Interface for potential errors
interface GetUserUuidError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Get user UUID by username
 * @param username Username to look up
 * @returns Promise resolving to UUID string or null if user not found
 * @throws GetUserUuidError on database errors
 */
export async function getUuidByUsername(username: string): Promise<string | null> {
  const client = await pool.connect();
  
  try {
    // Log start of UUID search
    await createAndPublishEvent({
      eventName: GET_UUID_BY_USERNAME_EVENTS.START.eventName,
      payload: { username }
    });

    const userQuery = 'SELECT user_id FROM app.users WHERE username = $1';
    const userResult: QueryResult = await client.query(userQuery, [username]);
    
    if (!userResult.rows || userResult.rows.length === 0) {
      // Log user not found
      await createAndPublishEvent({
        eventName: GET_UUID_BY_USERNAME_EVENTS.NOT_FOUND.eventName,
        payload: { username, found: false }
      });
      return null;
    }
    
    const uuid = userResult.rows[0].user_id;
    
    // Log successful UUID retrieval
    await createAndPublishEvent({
      eventName: GET_UUID_BY_USERNAME_EVENTS.SUCCESS.eventName,
      payload: { username, uuid }
    });
    
    return uuid;
  } catch (error) {
    // Log error during UUID retrieval
    await createAndPublishEvent({
      eventName: GET_UUID_BY_USERNAME_EVENTS.ERROR.eventName,
      payload: { username, error: error instanceof Error ? error.message : String(error) },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    const getUserUuidError: GetUserUuidError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to get user UUID',
      details: { username, error }
    };
    throw getUserUuidError;
  } finally {
    client.release();
  }
}

export default getUuidByUsername;