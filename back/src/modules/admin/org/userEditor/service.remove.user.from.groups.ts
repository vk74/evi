/**
 * @file service.remove.user.from.groups.ts
 * Version: 1.0.0
 * Backend service for removing user from groups.
 * Backend file that handles user removal from multiple groups via API and error processing.
 * 
 * Functionality:
 * - Removes user from multiple groups via API
 * - Handles API response and error processing
 * - Uses event bus for tracking operations and enhancing observability
 */

import { Request } from 'express';
import { Pool, QueryResult } from 'pg';
import { queries } from './queries.user.editor';
import { 
  RemoveUserFromGroupsRequest, 
  RemoveUserFromGroupsResponse,
  ValidationError,
  ServiceError
} from './types.user.editor';
import { pool as pgPool } from '../../../../core/db/maindb';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { USER_GROUPS_REMOVE_EVENTS } from './events.user.editor';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Service function to remove user from groups
 * @param request RemoveUserFromGroupsRequest containing the user ID and array of group IDs
 * @param req Express request object for context
 * @returns RemoveUserFromGroupsResponse with removal status and details
 */
export async function removeUserFromGroups(request: RemoveUserFromGroupsRequest, req: Request): Promise<RemoveUserFromGroupsResponse> {
  const { userId, groupIds } = request;

  try {
    // Get the UUID of the user making the request
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Create event for removal request
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_GROUPS_REMOVE_EVENTS.REQUEST_RECEIVED.eventName,
      payload: { 
        userId, 
        groupIdsCount: groupIds?.length || 0,
        requestorUuid
      }
    });
    
    // Start database transaction
    await pool.query('BEGIN');
    
    // Create event for transaction start
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_GROUPS_REMOVE_EVENTS.TRANSACTION_START.eventName,
      payload: { userId, requestorUuid }
    });
    
    // Input validation
    if (!userId) {
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'User ID is required',
        field: 'userId'
      };
      
      // Create event for validation error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USER_GROUPS_REMOVE_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          userId: 'undefined',
          field: 'userId',
          message: 'User ID is required'
        },
        errorData: 'User ID is required'
      });
      
      throw validationError;
    }

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'At least one group ID must be provided',
        field: 'groupIds'
      };
      
      // Create event for validation error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: USER_GROUPS_REMOVE_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          userId,
          field: 'groupIds',
          message: 'At least one group ID must be provided'
        },
        errorData: 'At least one group ID must be provided'
      });
      
      throw validationError;
    }

    // Create event for successful validation
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_GROUPS_REMOVE_EVENTS.VALIDATION_PASSED.eventName,
      payload: { userId, groupIdsCount: groupIds.length }
    });

    // Perform query to remove user from groups with parameterized values to prevent SQL injection
    const result: QueryResult = await pool.query(queries.removeUserFromGroups.text, [
      userId,
      groupIds
    ]);
    
    const removedGroupIds = result.rows.map(row => row.group_id);
    const removedCount = removedGroupIds.length;

    // Create event for successful removal
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_GROUPS_REMOVE_EVENTS.COMPLETE.eventName,
      payload: {
        userId,
        removedCount,
        removedGroupIds,
        requestorUuid
      }
    });

    // Commit transaction
    await pool.query('COMMIT');

    // Return formatted response
    return {
      success: true,
      message: removedCount > 0 
        ? `Successfully removed user from ${removedCount} group${removedCount !== 1 ? 's' : ''}`
        : 'No groups were removed from user',
      data: {
        removedCount,
        removedGroupIds
      }
    };
  } catch (error) {
    // Rollback transaction on error
    await pool.query('ROLLBACK');
    
    // If error already has the correct format (has code), just pass it through
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }
    
    // Create event for error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: USER_GROUPS_REMOVE_EVENTS.FAILED.eventName,
      payload: {
        userId,
        error: {
          code: 'SERVICE_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      },
      errorData: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Wrap other errors in ServiceError format
    const serviceError: ServiceError = {
      code: 'SERVICE_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    throw serviceError;
  }
}
