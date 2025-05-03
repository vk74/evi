/**
 * service.delete.group.members.ts - version 1.0.02
 * BACKEND service for removing members from a specific group.
 * 
 * Functionality:
 * - Validates input parameters
 * - Removes group members from the database
 * - Handles data transformation and business logic
 * - Manages error handling
 * - Uses event bus for tracking operations and enhancing observability
 */

import { Request } from 'express';
import { Pool, QueryResult } from 'pg';
import { queries } from './queries.group.editor';
import { 
  RemoveGroupMembersRequest, 
  RemoveGroupMembersResponse,
  ValidationError,
  ServiceError
} from './types.group.editor';
import { pool as pgPool } from '../../../../db/maindb';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_MEMBERS_EVENTS } from './events.group.editor';

// Type assertion for pool
const pool = pgPool as Pool;

/**
 * Service function to remove members from a group
 * @param request RemoveGroupMembersRequest containing the group ID and array of user IDs
 * @param req Express request object for context
 * @returns RemoveGroupMembersResponse with removal status and details
 */
export async function removeGroupMembers(request: RemoveGroupMembersRequest, req: Request): Promise<RemoveGroupMembersResponse> {
  const { groupId, userIds } = request;

  try {
    // Get the UUID of the user making the request
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Создаем событие для запроса на удаление участников группы
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_MEMBERS_EVENTS.REMOVE_REQUEST_RECEIVED.eventName,
      payload: { 
        groupId, 
        userIdsCount: userIds?.length || 0,
        requestorUuid
      }
    });
    
    // Input validation
    if (!groupId) {
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'Group ID is required',
        field: 'groupId'
      };
      
      // Создаем событие для ошибки валидации
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_MEMBERS_EVENTS.REMOVE_FAILED.eventName,
        payload: {
          groupId: 'undefined',
          error: 'Group ID is required'
        },
        errorData: 'Group ID is required'
      });
      
      throw validationError;
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      const validationError: ValidationError = {
        code: 'VALIDATION_ERROR',
        message: 'At least one user ID must be provided',
        field: 'userIds'
      };
      
      // Создаем событие для ошибки валидации
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_MEMBERS_EVENTS.REMOVE_FAILED.eventName,
        payload: {
          groupId,
          error: 'At least one user ID must be provided'
        },
        errorData: 'At least one user ID must be provided'
      });
      
      throw validationError;
    }

    // Perform query to remove group members with parameterized values to prevent SQL injection
    const result: QueryResult = await pool.query(queries.removeGroupMembers.text, [
      groupId,
      userIds
    ]);
    
    const removedUserIds = result.rows.map(row => row.user_id);
    const removedCount = removedUserIds.length;

    // Создаем событие для успешного удаления участников группы
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_MEMBERS_EVENTS.REMOVE_COMPLETE.eventName,
      payload: {
        groupId,
        removedCount,
        removedUserIds,
        requestorUuid
      }
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
    // If error already has the correct format (has code), just pass it through
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }

    // Otherwise create a service error
    // Создаем событие для неожиданной ошибки
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_MEMBERS_EVENTS.REMOVE_FAILED.eventName,
      payload: {
        groupId,
        error: 'Failed to remove group members from database'
      },
      errorData: error instanceof Error ? error.stack : 'Unknown error'
    });
    
    const serviceError: ServiceError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to remove group members from database',
      details: error instanceof Error ? error.stack : 'Unknown error'
    };

    throw serviceError;
  }
}

export default removeGroupMembers;