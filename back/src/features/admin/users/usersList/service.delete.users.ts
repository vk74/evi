/**
 * @file service.delete.users.ts - version 1.0.01
 * BACKEND service for user deletion operations.
 * 
 * Functionality:
 * - Handles deletion of users by UUID
 * - Supports batch deletion with transaction
 * - Invalidates cache after operations
 * - Uses request context for authentication and logging
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.users.list';
import { usersCache } from './cache.users.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';

// Cast pool to correct type
const pool = pgPool as Pool;

// Logger for service operations
const lgr = {
  info: (message: string, meta?: object) => console.log(`[UsersDeleteService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[UsersDeleteService] ${message}`, error || '')
};

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
    
    lgr.info('Starting delete operation for selected users', {
      userCount: userIds.length,
      requestorUuid
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
        lgr.info('Cache invalidated after user deletion', { deletedCount, requestorUuid });
      }
      
      lgr.info('Users deletion completed', {
        requested: userIds.length,
        deleted: deletedCount,
        requestorUuid
      });
      
      return deletedCount;
      
    } catch (error) {
      lgr.error('Error deleting users', error);
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