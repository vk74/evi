/**
 * service.create.group.ts - version 1.0.02
 * Backend service layer for handling group creation operations.
 * 
 * Handles:
 * - Input validation
 * - Database operations
 * - Transaction management
 * - Error handling
 * - Clear cache after successful group creation
 * - Uses event bus for tracking operations
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.group.editor';
import { GroupStatus } from './types.group.editor';
import { groupsRepository } from '../groupsList/repository.groups.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_CREATION_EVENTS } from './events.group.editor';
import type { 
  CreateGroupRequest, 
  CreateGroupResponse,
  ValidationError,
  UniqueCheckError,
  RequiredFieldError,
  ServiceError
} from './types.group.editor';

const pool = pgPool as Pool;

// Helper function to trim string fields
function trimData(data: CreateGroupRequest): CreateGroupRequest {
  return {
    group_name: data.group_name?.trim(),
    group_status: data.group_status,
    group_owner: data.group_owner?.trim(),
    group_email: data.group_email?.trim(),
    group_description: data.group_description?.trim()
  };
}

// Validation functions
async function validateRequiredFields(data: CreateGroupRequest, req: Request): Promise<void> {
  // Create event for validation start
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_CREATION_EVENTS.VALIDATION_PASSED.eventName,
    payload: {
      groupName: data.group_name
    }
  });
  
  const requiredFields = {
    group_name: 'Group name',
    group_status: 'Group status',
    group_owner: 'Group owner'
  } as const;

  const missingFields = Object.entries(requiredFields)
    .filter(([field]) => !data[field as keyof typeof requiredFields])
    .map(([, label]) => label);

  if (missingFields.length > 0) {
    // Create event for validation error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        field: missingFields[0].toLowerCase(),
        message: `Missing required fields: ${missingFields.join(', ')}`
      },
      errorData: `Missing required fields: ${missingFields.join(', ')}`
    });

    throw {
      code: 'REQUIRED_FIELD_ERROR',
      message: `Missing required fields: ${missingFields.join(', ')}`,
      field: missingFields[0].toLowerCase()
    } as RequiredFieldError;
  }
}

async function validateGroupName(name: string, req: Request): Promise<void> {
  if (name.length < 2) {
    // Create event for validation error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        field: 'group_name',
        message: 'Minimum group name length is 2 characters',
        length: name.length,
        minLength: 2
      },
      errorData: 'Group name too short'
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Minimum group name length is 2 characters',
      field: 'group_name'
    } as ValidationError;
  }

  if (name.length > 100) {
    // Create event for validation error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        field: 'group_name',
        message: 'Maximum group name length is 100 characters',
        length: name.length,
        maxLength: 100
      },
      errorData: 'Group name too long'
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Maximum group name length is 100 characters',
      field: 'group_name'
    } as ValidationError;
  }

  if (!/^[a-zA-Z0-9-]+$/.test(name)) {
    // Create event for validation error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        field: 'group_name',
        message: 'Group name can only contain latin letters, numbers and hyphens',
        pattern: '^[a-zA-Z0-9-]+$'
      },
      errorData: 'Group name contains invalid characters'
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Group name can only contain latin letters, numbers and hyphens',
      field: 'group_name'
    } as ValidationError;
  }
}

async function validateEmail(email: string | undefined, req: Request): Promise<void> {
  if (!email) return;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  if (!emailRegex.test(email) || email.length > 254) {
    // Create event for validation error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        field: 'group_email',
        message: 'Invalid email format',
        length: email.length,
        maxLength: 254
      },
      errorData: 'Invalid email format'
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Invalid email format',
      field: 'group_email'
    } as ValidationError;
  }
}

async function validateDescription(description: string | undefined, req: Request): Promise<void> {
  if (!description) return;

  if (description.length > 5000) {
    // Create event for validation error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        field: 'group_description',
        message: 'Maximum description length is 5000 characters',
        length: description.length,
        maxLength: 5000
      },
      errorData: 'Description too long'
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Maximum description length is 5000 characters',
      field: 'group_description'
    } as ValidationError;
  }

  if (!/^[a-zA-Zа-яА-ЯёЁ0-9\s\-_.,!?()@#$%&'*+=/<>[\]{}"`~;:|]+$/.test(description)) {
    // Create event for validation error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        field: 'group_description',
        message: 'Description contains invalid characters',
        descriptionLength: description.length
      },
      errorData: 'Description contains invalid characters'
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Description contains invalid characters',
      field: 'group_description'
    } as ValidationError;
  }
}

async function checkUniqueness(groupName: string, req: Request): Promise<void> {
  // Create event for uniqueness check
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_CREATION_EVENTS.NAME_CHECK.eventName,
    payload: { groupName }
  });

  const result = await pool.query(queries.checkGroupName.text, [groupName]);
  if (result.rows.length > 0) {
    // Create event for uniqueness error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        field: 'group_name',
        message: 'Group name is already taken',
        groupName,
        existingGroupId: result.rows[0].group_id
      },
      errorData: 'Group name already exists'
    });

    throw {
      code: 'UNIQUE_CONSTRAINT_ERROR',
      message: 'Group name is already taken',
      field: 'group_name'
    } as UniqueCheckError;
  }
}

async function checkOwnerExists(ownerUsername: string, req: Request): Promise<void> {
  // Create event for owner existence check
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_CREATION_EVENTS.OWNER_CHECK.eventName,
    payload: { ownerUsername }
  });

  const result = await pool.query(queries.checkUserExists.text, [ownerUsername]);
  if (result.rows.length === 0) {
    // Create event for owner check error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.VALIDATION_FAILED.eventName,
      payload: {
        field: 'group_owner',
        message: 'Group owner does not exist',
        ownerUsername
      },
      errorData: 'Group owner does not exist'
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Group owner does not exist',
      field: 'group_owner'
    } as ValidationError;
  }
}

export async function createGroup(
  groupData: CreateGroupRequest, 
  currentUser: { username: string },
  req: Request
): Promise<CreateGroupResponse> {
  const client = await pool.connect();
  
  try {
    // Get the UUID of the user making the request
    const requestorUuid = getRequestorUuidFromReq(req);
    
    // Data preparation
    const trimmedData = trimData(groupData);

    // Validation
    await validateRequiredFields(trimmedData, req);
    await validateGroupName(trimmedData.group_name, req);
    await validateEmail(trimmedData.group_email, req);
    await validateDescription(trimmedData.group_description, req);
    
    if (!Object.values(GroupStatus).includes(trimmedData.group_status)) {
      // Create event for validation error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_CREATION_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          field: 'group_status',
          message: 'Invalid group status',
          providedStatus: trimmedData.group_status,
          allowedStatuses: Object.values(GroupStatus)
        },
        errorData: 'Invalid group status'
      });

      throw {
        code: 'VALIDATION_ERROR',
        message: 'Invalid group status',
        field: 'group_status'
      } as ValidationError;
    }

    // Database checks
    await checkUniqueness(trimmedData.group_name, req);
    await checkOwnerExists(trimmedData.group_owner, req);

    // Start transaction
    await client.query('BEGIN');
    
    // Create event for transaction start
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.TRANSACTION_START.eventName,
      payload: { requestorUuid }
    });
    
    // Get owner UUID
    const ownerResult = await client.query(
      queries.getUserId.text,
      [trimmedData.group_owner]
    );
    
    const ownerUuid = ownerResult.rows[0].user_id;
    
    // Create group with obtained UUID
    const groupResult = await client.query(
      queries.insertGroup.text,
      [
        trimmedData.group_name,    
        trimmedData.group_status,  
        ownerUuid,               
        false                   
      ]
    );
    
    const groupId = groupResult.rows[0].group_id;

    // Create group details
    await client.query(
      queries.insertGroupDetails.text,
      [
        groupId,
        trimmedData.group_description || null,
        trimmedData.group_email || null,
        requestorUuid // Use UUID of the user making the request
      ]
    );

    await client.query('COMMIT');
    
    // Create event for successful group creation
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.COMPLETE.eventName,
      payload: {
        groupId,
        groupName: trimmedData.group_name,
        requestorUuid
      }
    });

    try {
      // Clear cache
      groupsRepository.clearCache(); 
      
      // Check cache state
      const cacheStateAfter = groupsRepository.hasValidCache();
      
      if (!cacheStateAfter) {
        // Create event for successful cache clearing
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: GROUP_CREATION_EVENTS.CACHE_CLEARED.eventName,
          payload: { 
            groupId,
            requestorUuid 
          }
        });
      } else {
        // Create event for cache clearing error
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: GROUP_CREATION_EVENTS.CACHE_CLEAR_FAILED.eventName,
          payload: { 
            error: 'Cache is still valid after clearing',
            requestorUuid 
          },
          errorData: 'Failed to clear cache: cache is still valid'
        });
      }
    } catch (error) {
      // Create event for cache clearing error
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_CREATION_EVENTS.CACHE_CLEAR_FAILED.eventName,
        payload: { 
          error: error instanceof Error ? error.message : String(error),
          requestorUuid 
        },
        errorData: error instanceof Error ? error.message : String(error)
      });
    }

    return {
      success: true,
      message: 'Group created successfully',
      groupId,
      group_name: trimmedData.group_name
    };

  } catch (error) {
    await client.query('ROLLBACK');
    
    if ((error as ServiceError).code) {
      // If this is our error with code, just re-throw it
      throw error;
    }

    // Create event for unexpected error
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_CREATION_EVENTS.FAILED.eventName,
      payload: {
        groupName: trimmedData.group_name,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create group'
        }
      },
      errorData: error instanceof Error ? error.message : String(error)
    });

    throw {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to create group',
      details: error instanceof Error ? error.message : String(error)
    } as ServiceError;

  } finally {
    client.release();
  }
}

export default createGroup;