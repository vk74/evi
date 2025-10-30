/**
 * @file protoService.delete.users.ts
 * Version: 1.0.1
 * BACKEND service for prototype user deletion operations with server-side processing.
 * 
 * Functionality:
 * - Prevents deletion of system accounts (is_system=true) and reports attempted usernames
 * - Handles deletion of users by UUID
 * - Supports batch deletion with transaction
 * - Invalidates cache after operations
 * - Uses event bus for tracking operations
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.users.list';
import { usersCache } from './cache.users.list';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_DELETE_EVENTS } from './events.users.list';

// Cast pool to correct type
const pool = pgPool as Pool;

/**
 * Service for handling user deletion operations
 */
export const usersDeleteService = {
  /**
   * Deletes selected users by their UUIDs
   * @param userIds Array of user UUIDs to delete
   * @param req Express request object for context
   * @returns Promise with the count of deleted users
   */
  async deleteSelectedUsers(userIds: string[], req: Request): Promise<number> {
    
    // Prevent deletion of empty array
    if (!userIds.length) {
      return 0;
    }
    
    // Pre-check: fetch selected users and block system accounts deletion
    const precheck = await pool.query(queries.fetchUsersByIdsForDeletion, [userIds]);
    const systemUsers = precheck.rows.filter((r: any) => r.is_system === true);
    if (systemUsers.length > 0) {
      const systemUsernames: string[] = systemUsers.map((r: any) => r.username);
      // Publish event about prohibited deletion attempt
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_DELETE_EVENTS.FAILED.eventName,
        payload: {
          userIds,
          error: {
            code: 'SYSTEM_USERS_SELECTED',
            message: 'Attempt to delete system accounts is prohibited',
            systemUsernames
          }
        }
      });
      // Throw structured error
      throw {
        code: 'SYSTEM_USERS_SELECTED',
        message: 'System accounts cannot be deleted',
        systemUsernames
      };
    }
    
    try {
      // Execute deletion query
      const result = await pool.query(queries.deleteSelectedUsers, [userIds]);
      
      // Get delete count
      const deletedCount = result.rows.length;
      
      // Invalidate cache after successful deletion
      if (deletedCount > 0) {
        usersCache.invalidate('delete');
        
        // Create event for cache invalidation
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: USERS_DELETE_EVENTS.CACHE_INVALIDATED.eventName,
          payload: { deletedCount }
        });
      }
      
      // Create event for successful completion
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          requested: userIds.length,
          deleted: deletedCount
        }
      });
      
      return deletedCount;
      
    } catch (error) {
      // Create event for deletion failure
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_DELETE_EVENTS.FAILED.eventName,
        payload: {
          userIds: userIds.length,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Error occurred while deleting users'
          }
        },
        errorData: error instanceof Error ? error.message : String(error)
      });
      
      throw {
        code: 'DATABASE_ERROR',
        message: 'Error deleting users',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      };
    }
  }
};

export default usersDeleteService;
