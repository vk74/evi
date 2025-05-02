/**
 * service.fetch.group.members.ts - version 1.0.01
 * BACKEND service for fetching members of a specific group.
 * 
 * Functionality:
 * - Validates input parameters
 * - Fetches group members from the database
 * - Formats data for frontend consumption
 * - Handles error cases
 * - Now accepts request object for access to user context
 */

import { Request } from 'express';
import { Pool, QueryResult } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.group.editor';
import { 
  FetchGroupMembersRequest, 
  FetchGroupMembersResponse,
  GroupMember,
  ValidationError,
  NotFoundError,
  ServiceError
} from './types.group.editor';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';

// Type assertion for pool
const pool = pgPool as Pool;

// Logging helper
function logService(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [FetchGroupMembersService] ${message}`, meta || '');
}

/**
 * Service function to fetch group members
 * @param request FetchGroupMembersRequest containing the group ID
 * @param req Express request object for context
 * @returns FetchGroupMembersResponse with members data
 */
export async function fetchGroupMembers(request: FetchGroupMembersRequest, req: Request): Promise<FetchGroupMembersResponse> {
  const { groupId } = request;

  try {
    // Get the UUID of the user making the request
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Input validation
    if (!groupId) {
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Group ID is required',
        field: 'groupId'
      };
      throw validationError;
    }

    // Log operation start
    logService('Fetching group members from database', { 
      groupId, 
      requestorUuid 
    });

    // Perform query to get group members
    const result: QueryResult = await pool.query(queries.getGroupMembers.text, [groupId]);
    
    // If no rows returned, group might not exist
    if (result.rows.length === 0) {
      // We need to check if the group exists
      const groupResult = await pool.query(queries.getGroupById.text, [groupId]);
      
      if (groupResult.rows.length === 0) {
        throw {
          code: 'NOT_FOUND',
          message: 'Group not found'
        } as NotFoundError;
      }
    }
    
    // Map database rows to GroupMember objects
    const members: GroupMember[] = result.rows.map(row => ({
      user_id: row.user_id,
      username: row.username,
      name: `${row.first_name} ${row.last_name}`.trim(),
      email: row.email,
      role: row.is_staff ? 'Administrator' : 'User'
    }));
    
    // Log successful fetch
    logService('Successfully fetched group members', { 
      groupId, 
      memberCount: members.length,
      requestorUuid
    });

    // Return formatted response
    return {
      success: true,
      message: 'Group members retrieved successfully',
      data: {
        members,
        total: members.length
      }
    };
    
  } catch (error) {
    // Log error
    logService('Error in fetchGroupMembers service', { groupId, error });

    // If error already has the correct format (has code), just pass it through
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }

    // Otherwise create a service error
    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to fetch group members from database',
      details: error instanceof Error ? error.stack : 'Unknown error'
    };

    throw serviceError;
  }
}

export default fetchGroupMembers;