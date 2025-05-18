/**
 * @file protoService.delete.users.ts
 * Version: 1.0.0
 * BACKEND service for prototype user deletion operations with server-side processing.
 * 
 * Functionality:
 * - Handles deletion of users by UUID
 * - Supports batch deletion with transaction
 * - Invalidates cache after operations
 * - Uses event bus for tracking operations
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './protoQueries.users.list';
import { usersProtoCache } from './protoCache.users.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USERS_DELETE_EVENTS } from './protoEvents.users.list';

// Cast pool to correct type
const pool = pgPool as Pool;

/**
 * Service for handling user deletion operations
 */
export const protoUsersDeleteService = {
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
        usersProtoCache.invalidate('delete');
        
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
        message: 'Error deleting users',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      };
    }
  }
};

export default protoUsersDeleteService;
