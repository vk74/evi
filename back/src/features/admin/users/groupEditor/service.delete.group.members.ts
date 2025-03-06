/**
 * service.delete.group.members.ts
 * BACKEND service for removing members from a specific group.
 * 
 * Functionality:
 * - Validates input parameters
 * - Removes group members from the database
 * - Handles data transformation and business logic
 * - Manages error handling
 * - Provides logging for operations
 */

import { Pool, QueryResult } from 'pg';
import { queries } from './queries.group.editor';
import { 
  RemoveGroupMembersRequest, 
  RemoveGroupMembersResponse,
  ValidationError,
  ServiceError
} from './types.group.editor';
import { pool as pgPool } from '../../../../db/maindb';

// Type assertion for pool
const pool = pgPool as Pool;

// Logging helper
function logService(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [RemoveGroupMembersService] ${message}`, meta || '');
}

/**
 * Service function to remove members from a group
 * @param request RemoveGroupMembersRequest containing the group ID and array of user IDs
 * @returns RemoveGroupMembersResponse with removal status and details
 */
export async function removeGroupMembers(request: RemoveGroupMembersRequest): Promise<RemoveGroupMembersResponse> {
  const { groupId, userIds } = request;

  try {
    // Input validation
    if (!groupId) {
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Group ID is required',
        field: 'groupId'
      };
      throw validationError;
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'At least one user ID must be provided',
        field: 'userIds'
      };
      throw validationError;
    }

    // Log operation start
    logService('Removing group members from database', { 
      groupId, 
      userIdsCount: userIds.length 
    });

    // Perform query to remove group members with parameterized values to prevent SQL injection
    const result: QueryResult = await pool.query(queries.removeGroupMembers.text, [
      groupId,
      userIds
    ]);
    
    const removedUserIds = result.rows.map(row => row.user_id);
    const removedCount = removedUserIds.length;

    // Log successful removal
    logService('Successfully removed group members', {
      groupId,
      removedCount,
      removedUserIds
    });

    // Return formatted response
    return {
      success: true,
      message: removedCount > 0 
        ? `Successfully removed ${removedCount} member${removedCount !== 1 ? 's' : ''} from the group`
        : 'No members were removed from the group',
      data: {
        removedCount,
        removedUserIds
      }
    };
  } catch (error) {
    // Log error
    logService('Error in removeGroupMembers service', { groupId, userIds, error });

    // If error already has the correct format (has code), just pass it through
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }

    // Otherwise create a service error
    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to remove group members from database',
      details: error instanceof Error ? error.stack : 'Unknown error'
    };

    throw serviceError;
  }
}

export default removeGroupMembers;