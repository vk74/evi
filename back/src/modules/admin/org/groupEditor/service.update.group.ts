/**
 * service.update.group.ts - version 1.1.0
 * Service for handling group update business logic and database operations.
 * Performs validation using common backend rules, updates group data in app.groups table, and manages transactions.
 * Uses event bus for tracking operations and enhancing observability.
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.group.editor';
import type { UpdateGroupRequest, UpdateGroupResponse, ServiceError, ValidationError, NotFoundError } from './types.group.editor';
import { validateField } from '../../../../core/validation/service.validation';
import { groupsRepository } from '../groupsList/repository.groups.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_UPDATE_EVENTS } from './events.group.editor';

const pool = pgPool as Pool;

export async function updateGroupById(updateData: UpdateGroupRequest, req: Request): Promise<UpdateGroupResponse> {
  // Get the UUID of the user making the request
  const requestorUuid = getRequestorUuidFromReq(req);

  // Create and publish validation passed event
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
    payload: {
      groupId: updateData.group_id,
      requestorUuid,
      updatedFields: Object.keys(updateData).filter(key => key !== 'group_id')
    }
  });

  // Validate group_name if provided using centralized validation
  if (updateData.group_name !== undefined) {
    const result = await validateField({ value: updateData.group_name, fieldType: 'groupName' }, req);
    if (!result.isValid) {
      const message = result.error || 'Invalid group name';
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          field: 'group_name',
          message
        },
        errorData: message
      });

      throw {
        code: 'VALIDATION_ERROR',
        message,
        field: 'group_name',
        details: message,
      } as ValidationError;
    }
  }

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
      updateData.group_description || null, // $5: group_description (can be null)
      updateData.group_email || null, // $6: group_email (can be null)
      requestorUuid || updateData.modified_by // $7: group_modified_by (UUID of the modifier)
    ];

    // Update group data in unified app.groups table
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