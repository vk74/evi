/**
 * service.update.group.ts - version 1.0.02
 * Service for handling group update business logic and database operations.
 * Performs validation using common backend rules, updates group data in app.groups and app.group_details, and manages transactions.
 * Uses event bus for tracking operations and enhancing observability.
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.group.editor';
import type { UpdateGroupRequest, UpdateGroupResponse, ServiceError, ValidationError, NotFoundError } from './types.group.editor';
import { REGEX, VALIDATION } from '../../../../core/validation/rules.common.fields';
import { groupsRepository } from '../groupsList/repository.groups.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_UPDATE_EVENTS } from './events.group.editor';

const pool = pgPool as Pool;

export async function updateGroupById(updateData: UpdateGroupRequest, req: Request): Promise<UpdateGroupResponse> {
  // Get UUID of the user making the request
  const requestorUuid = getRequestorUuidFromReq(req);

  // Create event for group update start
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_UPDATE_EVENTS.REQUEST_RECEIVED.eventName,
    payload: { 
      groupId: updateData.group_id,
      requestorUuid
    }
  });

  // Validate group_name if provided, using common rules
  if (updateData.group_name !== undefined) { // Check that field is provided (including null/empty)
    if (!updateData.group_name) {
      // Create event for validation error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          field: 'group_name',
          message: VALIDATION.GROUP_NAME.MESSAGES.REQUIRED
        },
        errorData: 'Group name is empty'
      });

      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.REQUIRED,
        field: 'group_name',
        details: 'Group name is empty',
      } as ValidationError;
    }
    if (updateData.group_name.length < VALIDATION.GROUP_NAME.MIN_LENGTH) {
      // Create event for validation error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          field: 'group_name',
          message: VALIDATION.GROUP_NAME.MESSAGES.MIN_LENGTH,
          length: updateData.group_name.length,
          minLength: VALIDATION.GROUP_NAME.MIN_LENGTH
        },
        errorData: `Group name must be at least ${VALIDATION.GROUP_NAME.MIN_LENGTH} characters long`
      });

      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.MIN_LENGTH,
        field: 'group_name',
        details: `Group name must be at least ${VALIDATION.GROUP_NAME.MIN_LENGTH} characters long`,
      } as ValidationError;
    }
    if (updateData.group_name.length > VALIDATION.GROUP_NAME.MAX_LENGTH) {
      // Create event for validation error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          field: 'group_name',
          message: VALIDATION.GROUP_NAME.MESSAGES.MAX_LENGTH,
          length: updateData.group_name.length,
          maxLength: VALIDATION.GROUP_NAME.MAX_LENGTH
        },
        errorData: `Group name cannot exceed ${VALIDATION.GROUP_NAME.MAX_LENGTH} characters`
      });

      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.MAX_LENGTH,
        field: 'group_name',
        details: `Group name cannot exceed ${VALIDATION.GROUP_NAME.MAX_LENGTH} characters`,
      } as ValidationError;
    }
    if (!REGEX.GROUP_NAME.test(updateData.group_name)) {
      // Create event for validation error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          field: 'group_name',
          message: VALIDATION.GROUP_NAME.MESSAGES.INVALID_CHARS,
          pattern: REGEX.GROUP_NAME.toString()
        },
        errorData: 'Group name can only contain Latin letters, numbers, and hyphens'
      });

      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.INVALID_CHARS,
        field: 'group_name',
        details: 'Group name can only contain Latin letters, numbers, and hyphens',
      } as ValidationError;
    }
  }

  // Create event for successful validation
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
    payload: { 
      groupId: updateData.group_id,
      requestorUuid
    }
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Create event for transaction start
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_UPDATE_EVENTS.TRANSACTION_START.eventName,
      payload: { 
        groupId: updateData.group_id,
        requestorUuid
      }
    });

    // Prepare parameters for updating app.groups
    // Pass null for unspecified fields, COALESCE in query will preserve current values
    const groupParams = [
      updateData.group_id, // $1: group_id (required)
      updateData.group_name || null, // $2: group_name (can be null)
      updateData.group_status || null, // $3: group_status (can be null, COALESCE will preserve current value)
      updateData.group_owner || null, // $4: group_owner (can be null, COALESCE will preserve current value)
    ];

    // Update group data in app.groups
    const groupResult = await client.query(
      queries.updateGroupById,
      groupParams
    );

    if (groupResult.rowCount === 0) {
      // Create event for "group not found" error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.FAILED.eventName,
        payload: {
          groupId: updateData.group_id,
          error: {
            code: 'NOT_FOUND',
            message: 'Group not found'
          }
        },
        errorData: 'No group found with the provided group_id'
      });

      throw {
        code: 'NOT_FOUND',
        message: 'Group not found',
        details: 'No group found with the provided group_id',
      } as NotFoundError;
    }

    // Prepare parameters for updating app.group_details
    const detailsParams = [
      updateData.group_id,
      updateData.group_description || null,
      updateData.group_email || null,
      requestorUuid || updateData.modified_by // Use UUID from request or passed modified_by
    ];

    // Update group data in app.group_details
    const detailsResult = await client.query(
      queries.updateGroupDetailsById,
      detailsParams
    );

    if (detailsResult.rowCount === 0) {
      // Create event for "group details not found" error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.FAILED.eventName,
        payload: {
          groupId: updateData.group_id,
          error: {
            code: 'NOT_FOUND',
            message: 'Group details not found'
          }
        },
        errorData: 'No group details found for the provided group_id'
      });

      throw {
        code: 'NOT_FOUND',
        message: 'Group details not found',
        details: 'No group details found for the provided group_id',
      } as NotFoundError;
    }

    await client.query('COMMIT');
    
    // Create event for successful group update
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_UPDATE_EVENTS.COMPLETE.eventName,
      payload: { 
        groupId: updateData.group_id,
        requestorUuid
      }
    });
    
    // Clear groups list cache
    try {
      groupsRepository.clearCache();
      
      // Check cache clearing
      const cacheStateAfter = groupsRepository.hasValidCache();
      
      if (!cacheStateAfter) {
        // Create event for successful cache clearing
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: GROUP_UPDATE_EVENTS.CACHE_CLEARED.eventName,
          payload: { 
            groupId: updateData.group_id,
            requestorUuid 
          }
        });
      } else {
        // Create event for cache clearing error
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: GROUP_UPDATE_EVENTS.CACHE_CLEAR_FAILED.eventName,
          payload: { 
            groupId: updateData.group_id,
            error: 'Cache is still valid after clearing',
            requestorUuid 
          },
          errorData: 'Failed to clear cache: cache still valid'
        });
      }
    } catch (error) {
      // Create event for cache clearing error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.CACHE_CLEAR_FAILED.eventName,
        payload: { 
          groupId: updateData.group_id,
          error: error instanceof Error ? error.message : String(error),
          requestorUuid 
        },
        errorData: error instanceof Error ? error.message : String(error)
      });
    }

    return {
      success: true,
      message: 'Group updated successfully',
      groupId: updateData.group_id, // Use UpdateGroupResponse-compatible object
    };

  } catch (err: unknown) {
    await client.query('ROLLBACK');

    const error = err as ServiceError;
    
    if ((error as ServiceError).code) {
      // If this is our error with code, just re-throw it
      throw error;
    }

    // Create event for unexpected error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_UPDATE_EVENTS.FAILED.eventName,
      payload: {
        groupId: updateData.group_id,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update group data'
        }
      },
      errorData: error instanceof Error ? error.message : String(error)
    });

    throw {
      code: error?.code || 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to update group data',
      details: error instanceof Error ? error.message : String(error), // Ensure details is a string
    } as ServiceError;

  } finally {
    client.release();
  }
}

export default updateGroupById;