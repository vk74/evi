/**
 * @file service.delete.group.ts - version 1.0.0
 * Backend service for deleting a single group.
 *
 * Functionality:
 * - Deletes a single group from the database.
 * - Validates group existence before deletion.
 * - Uses event bus for tracking operations and error handling.
 */

import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.group.editor';
import { createSystemLgr, Lgr } from '../../../../core/lgr/lgr.index';
import { GroupEvents } from '../../../../core/lgr/codes/admin/users';

// Explicitly set type for pool
const pool = pgPool as Pool;

// Create lgr for service
const lgr: Lgr = createSystemLgr({
  module: 'DeleteGroupService',
  fileName: 'service.delete.group.ts'
});

/**
 * Deletes a single group by its ID
 * @param groupId - UUID of the group to delete
 * @param username - Username of the user performing the deletion
 * @returns Promise<boolean> - Success status
 * @throws {Error} - If an error occurs
 */
export async function deleteGroup(groupId: string, username: string): Promise<boolean> {
  try {
    lgr.info({
      code: GroupEvents.DELETE.INITIATED.code,
      message: 'Starting group deletion',
      details: { groupId, username }
    });

    // Check if group exists
    const groupExists = await pool.query(queries.checkGroupExists, [groupId]);
    if (groupExists.rows.length === 0) {
      lgr.error({
        code: GroupEvents.DELETE.GROUP_NOT_FOUND.code,
        message: 'Group not found for deletion',
        details: { groupId, username }
      });
      
      throw {
        code: 'NOT_FOUND',
        message: 'Group not found',
        field: 'groupId'
      };
    }

    // Delete the group
    const result = await pool.query(queries.deleteGroup, [groupId]);
    
    if (result.rowCount === 0) {
      lgr.error({
        code: GroupEvents.DELETE.FAILED.code,
        message: 'Failed to delete group',
        details: { groupId, username }
      });
      
      throw {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete group',
        details: 'No rows affected'
      };
    }

    lgr.info({
      code: GroupEvents.DELETE.SUCCESS.code,
      message: 'Group deleted successfully',
      details: { groupId, username }
    });

    return true;

  } catch (error) {
    lgr.error({
      code: GroupEvents.DELETE.FAILED.code,
      message: 'Error during group deletion',
      details: { 
        groupId, 
        username,
        error: error instanceof Error ? error.message : String(error)
      }
    });

    // Re-throw error
    throw error;
  }
} 