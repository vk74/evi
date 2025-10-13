/**
 * @file service.add.user.to.groups.ts
 * BACKEND Service for adding a user to multiple groups in the database.
 * 
 * Functionality:
 * - Validates input data (user and groups existence, permissions)
 * - Handles database operations
 * - Manages transactions for adding user to multiple groups
 * - Provides comprehensive error handling
 * - Returns formatted response
 * - Publishes events to event bus for monitoring and tracking
 */
import { Pool } from 'pg';
import { pool as pgPool } from '../../db/maindb';
import { queries } from './queries.item.selector';
import type { 
  AddUserToGroupsResponse,
  ServiceError, 
  ValidationError,
  NotFoundError
} from './types.item.selector';
import { getUserAccountStatus } from '../../helpers/get.user.account.status';
import { getSetting, parseSettingValue } from '../../../modules/admin/settings/cache.settings';
import { createAndPublishEvent } from '../../eventBus/fabric.events';
import { ADD_USER_TO_GROUPS_SERVICE_EVENTS } from './events.item.selector';

const pool = pgPool as Pool;

// Types for database results
interface GroupIdRow {
  group_id: string;
}

/**
 * Validates if a user exists in the database
 * @param userId UUID of the user to validate
 * @param client Database client for transaction support
 * @throws NotFoundError if user doesn't exist
 */
async function validateUserExists(userId: string, client: any): Promise<void> {
  // Publish user validation event
  await createAndPublishEvent({
    eventName: ADD_USER_TO_GROUPS_SERVICE_EVENTS.VALIDATION_USER.eventName,
    payload: { userId }
  });

  const result = await client.query(queries.checkUserExists.text, [userId]);
  if (result.rows.length === 0) {
    // User not found - this will be handled by the calling function
    throw {
      code: 'NOT_FOUND_ERROR',
      message: 'User not found',
      field: 'userId'
    } as NotFoundError;
  }
}

/**
 * Validates if groups exist in the database
 * @param groupIds Array of group UUIDs to validate
 * @param client Database client for transaction support
 * @returns Array of valid group IDs
 * @throws ValidationError if no valid groups found
 */
async function validateGroupsExist(groupIds: string[], client: any): Promise<string[]> {
  // Publish groups validation event
  await createAndPublishEvent({
    eventName: ADD_USER_TO_GROUPS_SERVICE_EVENTS.VALIDATION_GROUPS.eventName,
    payload: { groupCount: groupIds.length }
  });
  
  const result = await client.query(queries.checkGroupsExist.text, [groupIds]);
  const validGroupIds = result.rows.map((row: GroupIdRow) => row.group_id);

  if (validGroupIds.length === 0) {
    // No valid groups found - this will be handled by the calling function
    throw {
      code: 'VALIDATION_ERROR',
      message: 'No valid groups found',
      field: 'groupIds'
    } as ValidationError;
  }
  
  return validGroupIds;
}

/**
 * Filters out groups where the user is already a member to prevent duplicates
 * @param userId UUID of the user
 * @param groupIds Array of group UUIDs to check
 * @param client Database client for transaction support
 * @returns Array of group IDs where user is not already a member
 */
async function filterExistingMemberships(userId: string, groupIds: string[], client: any): Promise<string[]> {
  const result = await client.query(queries.checkExistingMemberships.text, [userId, groupIds]);
  const existingGroupIds = result.rows.map((row: GroupIdRow) => row.group_id);
  
  const newGroupIds = groupIds.filter(id => !existingGroupIds.includes(id));
  
  return newGroupIds;
}

/**
 * Validates user account status and checks if it meets requirements
 * @param userId User UUID to validate
 * @returns Boolean indicating if user can be added to groups
 */
async function validateUserAccountStatus(userId: string): Promise<boolean> {
  // Publish account status validation event
  await createAndPublishEvent({
    eventName: ADD_USER_TO_GROUPS_SERVICE_EVENTS.VALIDATION_ACCOUNT_STATUS.eventName,
    payload: { userId }
  });
  
  try {
    // Get account status from helper
    const accountStatus = await getUserAccountStatus(userId);
    
    if (!accountStatus) {
      return false;
    }
    
    // If user is active, allow adding to groups
    if (accountStatus === 'active') {
      return true;
    }
    
    // For non-active users, check application settings
    const settingPath = 'OrganizationManagement.GroupsManagement';
    const settingName = 'add.only.active.users.to.groups';
    const setting = getSetting(settingPath, settingName);
    
    // Default to true (only active users) if setting not found
    let onlyAddActiveUsers = true;
    
    if (setting) {
      onlyAddActiveUsers = parseSettingValue(setting) === true;
    }
    
    // If setting is true, only active users can be added to groups
    if (onlyAddActiveUsers) {
      return false;
    }
    
    // If setting is false, allow adding non-active users
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Main service function to add a user to multiple groups
 * @param userId UUID of the user to add to groups
 * @param groupIds Array of group UUIDs to add the user to
 * @param addedBy UUID of the user performing the action
 * @returns Promise with response indicating success and count of added groups
 */
export async function addUserToGroups(
  userId: string,
  groupIds: string[],
  addedBy: string
): Promise<AddUserToGroupsResponse> {
  const client = await pool.connect();
  
  try {
    // Publish service initiated event
    await createAndPublishEvent({
      eventName: ADD_USER_TO_GROUPS_SERVICE_EVENTS.SERVICE_INITIATED.eventName,
      payload: { 
        userId, 
        groupsCount: groupIds.length,
        addedBy 
      }
    });

    // Validate inputs
    if (!userId || !groupIds || groupIds.length === 0 || !addedBy) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Missing required parameters',
        field: !userId ? 'userId' : !groupIds ? 'groupIds' : 'addedBy'
      } as ValidationError;
    }

    // Start transaction
    await client.query('BEGIN');
    
    // Publish transaction start event
    await createAndPublishEvent({
      eventName: ADD_USER_TO_GROUPS_SERVICE_EVENTS.DATABASE_TRANSACTION_START.eventName,
      payload: { userId }
    });

    // Validate user exists
    await validateUserExists(userId, client);
    
    // Validate groups exist and get valid group IDs
    const validGroupIds = await validateGroupsExist(groupIds, client);
    
    // Filter out groups where user is already a member
    const newGroupIds = await filterExistingMemberships(userId, validGroupIds, client);
    
    // If no new groups to add after filtering
    if (newGroupIds.length === 0) {
      await client.query('COMMIT');
      
      // Publish no change event
      await createAndPublishEvent({
        eventName: ADD_USER_TO_GROUPS_SERVICE_EVENTS.SERVICE_RESPONSE_NO_CHANGE.eventName,
        payload: { userId }
      });
      
      return {
        success: true,
        message: 'User is already a member of all selected groups',
        count: 0
      };
    }

    // Validate account status for the user
    const isEligible = await validateUserAccountStatus(userId);
    
    if (!isEligible) {
      await client.query('COMMIT');
      
      return {
        success: false,
        message: 'User cannot be added to groups due to account status restrictions',
        count: 0
      };
    }

    // Add user to eligible groups
    const addedGroups = [];
    
    // Publish database update event
    await createAndPublishEvent({
      eventName: ADD_USER_TO_GROUPS_SERVICE_EVENTS.DATABASE_UPDATE.eventName,
      payload: { 
        userId, 
        groupCount: newGroupIds.length 
      }
    });

    for (const groupId of newGroupIds) {
      const result = await client.query(
        queries.addUserToGroup.text,
        [groupId, userId, addedBy]
      );
      
      if (result.rowCount && result.rowCount > 0) {
        addedGroups.push(groupId);
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    
    // Publish database success event
    await createAndPublishEvent({
      eventName: ADD_USER_TO_GROUPS_SERVICE_EVENTS.DATABASE_SUCCESS.eventName,
      payload: { 
        userId, 
        addedCount: addedGroups.length,
        skippedCount: newGroupIds.length - addedGroups.length
      }
    });

    // Check if some groups were filtered out due to account status
    const skippedCount = newGroupIds.length - addedGroups.length;
    let message = `User successfully added to ${addedGroups.length} group(s)`;
    
    if (skippedCount > 0) {
      message += `, ${skippedCount} group(s) skipped due to account status restrictions`;
    }

    // Publish service success event
    await createAndPublishEvent({
      eventName: ADD_USER_TO_GROUPS_SERVICE_EVENTS.SERVICE_RESPONSE_SUCCESS.eventName,
      payload: { 
        userId, 
        addedCount: addedGroups.length,
        skippedCount: skippedCount
      }
    });

    return {
      success: true,
      message,
      count: addedGroups.length
    };

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    
    // Publish service error event
    await createAndPublishEvent({
      eventName: ADD_USER_TO_GROUPS_SERVICE_EVENTS.SERVICE_RESPONSE_ERROR.eventName,
      payload: {
        userId,
        errorCode: (error as ServiceError).code || 'UNKNOWN_ERROR'
      },
      errorData: error instanceof Error ? error.message : String(error)
    });
    
    if ((error as ServiceError).code) {
      throw error;
    }

    // Format unknown errors
    throw {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to add user to groups',
      details: error instanceof Error ? error.message : String(error)
    } as ServiceError;

  } finally {
    // Release client back to pool
    client.release();
  }
}

export default addUserToGroups;
