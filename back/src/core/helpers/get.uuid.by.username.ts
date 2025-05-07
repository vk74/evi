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
import { pool as pgPool } from '../../db/maindb';

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
    console.log(`Getting UUID for username: ${username}`);

    const userQuery = 'SELECT user_id FROM app.users WHERE username = $1';
    const userResult: QueryResult = await client.query(userQuery, [username]);
    
    if (!userResult.rows || userResult.rows.length === 0) {
      console.log(`User not found in database: ${username}`);
      return null;
    }
    
    const uuid = userResult.rows[0].user_id;
    console.log(`UUID found for user ${username}: ${uuid}`);
    
    return uuid;
  } catch (error) {
    console.error('Error getting user UUID:', error);
    
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