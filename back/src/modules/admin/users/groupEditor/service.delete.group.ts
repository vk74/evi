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
import { createAndPublishEvent } from '../../../../core/eventBus/fabric.events';
import { GROUP_DELETE_EVENTS } from './events.group.editor';

// Explicitly set type for pool
const pool = pgPool as Pool;

/**
 * Deletes a single group by its ID
 * @param groupId - UUID of the group to delete
 * @param username - Username of the user performing the deletion
 * @param req - Express request object for event context
 * @returns Promise<boolean> - Success status
 * @throws {Error} - If an error occurs
 */
export async function deleteGroup(groupId: string, username: string, req?: any): Promise<boolean> {
  try {
    await createAndPublishEvent({
      req,
      eventName: GROUP_DELETE_EVENTS.TRANSACTION_START.eventName,
      payload: { groupId, username }
    });

    // Check if group exists
    const groupExists = await pool.query(queries.checkGroupExists, [groupId]);
    if (groupExists.rows.length === 0) {
      await createAndPublishEvent({
        req,
        eventName: GROUP_DELETE_EVENTS.GROUP_NOT_FOUND.eventName,
        payload: { groupId, username },
        errorData: 'Group not found for deletion'
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
      await createAndPublishEvent({
        req,
        eventName: GROUP_DELETE_EVENTS.FAILED.eventName,
        payload: { groupId, username },
        errorData: 'Failed to delete group - no rows affected'
      });
      
      throw {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete group',
        details: 'No rows affected'
      };
    }

    await createAndPublishEvent({
      req,
      eventName: GROUP_DELETE_EVENTS.COMPLETE.eventName,
      payload: { groupId, username }
    });

    return true;

  } catch (error) {
    await createAndPublishEvent({
      req,
      eventName: GROUP_DELETE_EVENTS.FAILED.eventName,
      payload: { 
        groupId, 
        username
      },
      errorData: error instanceof Error ? error.message : String(error)
    });

    // Re-throw error
    throw error;
  }
} 