/**
 * @file service.load.group.ts - version 1.0.0
 * Backend service for loading a single group.
 *
 * Functionality:
 * - Loads a single group from the database.
 * - Returns group data with details.
 * - Uses event bus for tracking operations and error handling.
 */

import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.group.editor';
import { createSystemLgr, Lgr } from '../../../../core/lgr/lgr.index';
import { GroupEvents } from '../../../../core/lgr/codes/admin/users';
import { GroupData } from './types.group.editor';

// Explicitly set type for pool
const pool = pgPool as Pool;

// Create lgr for service
const lgr: Lgr = createSystemLgr({
  module: 'LoadGroupService',
  fileName: 'service.load.group.ts'
});

/**
 * Loads a single group by its ID
 * @param groupId - UUID of the group to load
 * @param username - Username of the user performing the load
 * @returns Promise<GroupData | null> - Group data or null if not found
 * @throws {Error} - If an error occurs
 */
export async function loadGroup(groupId: string, username: string): Promise<GroupData | null> {
  try {
    lgr.info({
      code: GroupEvents.LOAD.INITIATED.code,
      message: 'Starting group load',
      details: { groupId, username }
    });

    // Load group base data
    const groupResult = await pool.query(queries.getGroupById, [groupId]);
    
    if (groupResult.rows.length === 0) {
      lgr.warn({
        code: GroupEvents.LOAD.GROUP_NOT_FOUND.code,
        message: 'Group not found',
        details: { groupId, username }
      });
      
      return null;
    }

    const groupData = groupResult.rows[0];

    // Load group details
    const detailsResult = await pool.query(queries.getGroupDetailsById, [groupId]);
    const detailsData = detailsResult.rows.length > 0 ? detailsResult.rows[0] : null;

    const result: GroupData = {
      group: {
        group_id: groupData.group_id,
        group_name: groupData.group_name,
        reserve_1: groupData.reserve_1,
        group_status: groupData.group_status,
        group_owner: groupData.group_owner,
        is_system: groupData.is_system
      },
      details: detailsData ? {
        group_id: detailsData.group_id,
        group_description: detailsData.group_description,
        group_email: detailsData.group_email,
        group_created_at: detailsData.group_created_at,
        group_created_by: detailsData.group_created_by,
        group_modified_at: detailsData.group_modified_at,
        group_modified_by: detailsData.group_modified_by,
        reserve_field_1: detailsData.reserve_field_1,
        reserve_field_2: detailsData.reserve_field_2,
        reserve_field_3: detailsData.reserve_field_3
      } : null
    };

    lgr.info({
      code: GroupEvents.LOAD.SUCCESS.code,
      message: 'Group loaded successfully',
      details: { groupId, username, hasDetails: !!detailsData }
    });

    return result;

  } catch (error) {
    lgr.error({
      code: GroupEvents.LOAD.FAILED.code,
      message: 'Error during group load',
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