/**
 * @file service.delete.users.ts - version 1.0.02
 * BACKEND service for user deletion operations.
 * 
 * Functionality:
 * - Handles deletion of users by UUID
 * - Supports batch deletion with transaction
 * - Invalidates cache after operations
 * - Uses event bus for tracking operations
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.users.list';
import { usersCache } from './cache.users.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
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
    // Get the UUID of the user making the request
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Create event for starting delete operation
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USERS_DELETE_EVENTS.REQUEST_RECEIVED.eventName,
      payload: {
        userCount: userIds.length,
        requestorUuid
      }
    });
    
    // Prevent deletion of empty array
    if (!userIds.length) {
      return 0;
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
          payload: { deletedCount, requestorUuid }
        });
      }
      
      // Create event for successful completion
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USERS_DELETE_EVENTS.COMPLETE.eventName,
        payload: {
          requested: userIds.length,
          deleted: deletedCount,
          requestorUuid
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
        message: 'Error occurred while deleting users',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error)) 
          : undefined
      };
    }
  }
};

export default usersDeleteService;