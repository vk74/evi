/**
 * @file service.delete.users.ts
 * Service for deleting users from database.
 * 
 * Functionality:
 * - Deletes multiple users by ID
 * - Invalidates cache after deletion
 * - Returns number of deleted records
 */

import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { usersCache } from './cache.users.list';
import { queries } from './queries.users.list';
import { UserError } from './types.users.list';

// Explicitly set the type for pool
const pool = pgPool as Pool;

// Logger for main operations
const logger = {
  info: (message: string, meta?: object) => console.log(`[UserDeleteService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => console.error(`[UserDeleteService] ${message}`, error || '')
};

/**
 * User data service for delete operations
 */
export const usersDeleteService = {
  /**
   * Deletes selected users by ID
   * @param userIds Array of user IDs to delete
   * @returns Number of deleted records
   */
  async deleteSelectedUsers(userIds: string[]): Promise<number> {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        logger.info('No valid user IDs provided for deletion');
        return 0;
      }
      
      logger.info('Deleting selected users', { count: userIds.length });
      
      const result = await pool.query(queries.deleteSelectedUsers, [userIds]);
      
      // Invalidate cache completely after deletion
      usersCache.invalidate('delete');
      
      const deletedCount = result.rowCount || 0; // Ensure we always return a number
      
      logger.info('Users deleted successfully', { deletedCount });
      
      return deletedCount;
      
    } catch (error) {
      logger.error('Error deleting users', error);
      throw {
        code: 'DELETE_ERROR',
        message: 'Error deleting users',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      } as UserError;
    }
  }
};

export default usersDeleteService;