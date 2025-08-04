/**
 * @file check.is.user.admin.ts
 * BACKEND Helper for checking if a user is an administrator
 * 
 * Functionality:
 * - Checks if a user is a member of the "administrators" group
 * - Uses get.uuid.by.group.name.ts helper to get the group UUID
 * - Uses cache to reduce database queries
 * - Performs error handling and logging
 * - Returns boolean result
 */

import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../db/maindb';
import { createAndPublishEvent } from '../eventBus/fabric.events';
import { CHECK_IS_USER_ADMIN_EVENTS } from './events.helpers';
import { getUuidByGroupName } from './get.uuid.by.group.name';
import { get, set, CacheKeys } from './cache.helpers';

// Type assertion for pool
const pool = pgPool as Pool;



// Interface for potential errors
interface AdminCheckError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Check if a user is an administrator (member of administrators group)
 * @param userId UUID of the user to check
 * @returns Promise resolving to boolean indicating if user is an administrator
 * @throws AdminCheckError on database errors
 */
export async function checkIsUserAdmin(userId: string): Promise<boolean> {
  try {
    // Log start of admin status check
    await createAndPublishEvent({
      eventName: CHECK_IS_USER_ADMIN_EVENTS.START.eventName,
      payload: { userId }
    });

    // Try to get result from cache first
    const cacheKey = CacheKeys.forUserAdmin(userId);
    const cachedResult = await get<boolean>(cacheKey);
    
    if (cachedResult !== undefined) {
      // Log cache hit
      await createAndPublishEvent({
        eventName: CHECK_IS_USER_ADMIN_EVENTS.SUCCESS_CACHE.eventName,
        payload: { userId, isAdmin: cachedResult, source: 'cache' }
      });
      return cachedResult;
    }

    // Get administrators group UUID using the helper
    const administratorsGroupName = 'administrators';
    const groupId = await getUuidByGroupName(administratorsGroupName);

    // If administrators group not found
    if (!groupId) {
      // Log group not found
      await createAndPublishEvent({
        eventName: CHECK_IS_USER_ADMIN_EVENTS.GROUP_NOT_FOUND.eventName,
        payload: { administratorsGroupName }
      });
      
      // Cache negative result
      await set(cacheKey, false);
      return false;
    }

    // Query to check if user is a member of the administrators group
    const query = {
      text: `
        SELECT 1 
        FROM app.group_members 
        WHERE group_id = $1 
        AND user_id = $2 
        AND is_active = true
        LIMIT 1
      `,
      values: [groupId, userId]
    };

    const result: QueryResult = await pool.query(query);
    
    // Check if user is a member of the administrators group
    const isAdmin = result.rowCount !== null && result.rowCount > 0;
    
    // Cache the result
    await set(cacheKey, isAdmin);
    
    if (isAdmin) {
      // Log user is admin
      await createAndPublishEvent({
        eventName: CHECK_IS_USER_ADMIN_EVENTS.USER_IS_ADMIN.eventName,
        payload: { userId, groupId }
      });
    } else {
      // Log user is not admin
      await createAndPublishEvent({
        eventName: CHECK_IS_USER_ADMIN_EVENTS.USER_NOT_ADMIN.eventName,
        payload: { userId, groupId }
      });
    }
    
    // Log successful completion
    await createAndPublishEvent({
      eventName: CHECK_IS_USER_ADMIN_EVENTS.SUCCESS_DB.eventName,
      payload: { userId, isAdmin, source: 'database' }
    });

    return isAdmin;
  } catch (error) {
    // Log error during admin status check
    await createAndPublishEvent({
      eventName: CHECK_IS_USER_ADMIN_EVENTS.ERROR.eventName,
      payload: { userId, error: error instanceof Error ? error.message : String(error) },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    const adminCheckError: AdminCheckError = {
      code: 'DB_ERROR',
      message: error instanceof Error ? error.message : 'Failed to check user admin status',
      details: { userId, error }
    };
    throw adminCheckError;
  }
}

export default checkIsUserAdmin;