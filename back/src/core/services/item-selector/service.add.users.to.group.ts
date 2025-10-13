/**
 * @file service.add.users.to.group.ts
 * BACKEND Service for adding users to a group in the database.
 * 
 * Functionality:
 * - Validates input data (group and user existence, permissions)
 * - Handles database operations
 * - Manages transactions for adding multiple users
 * - Provides comprehensive error handling
 * - Returns formatted response
 * - Publishes events to event bus for monitoring and tracking
 */
import { Pool } from 'pg';
import { pool as pgPool } from '../../db/maindb';
import { queries } from './queries.item.selector';
import type { 
  AddUsersToGroupResponse,
  ServiceError, 
  ValidationError,
  NotFoundError
} from './types.item.selector';
import { getUserAccountStatus } from '../../helpers/get.user.account.status';
import { getSetting, parseSettingValue } from '../../../modules/admin/settings/cache.settings';
import { createAndPublishEvent } from '../../eventBus/fabric.events';
import { ADD_USERS_TO_GROUP_SERVICE_EVENTS } from './events.item.selector';

const pool = pgPool as Pool;

// Types for database results
interface UserIdRow {
  user_id: string;
}

/**
 * Validates if a group exists in the database
 * @param groupId UUID of the group to validate
 * @param client Database client for transaction support
 * @throws NotFoundError if group doesn't exist
 */
async function validateGroupExists(groupId: string, client: any): Promise<void> {
  // Publish group validation event
  await createAndPublishEvent({
    eventName: ADD_USERS_TO_GROUP_SERVICE_EVENTS.VALIDATION_GROUP.eventName,
    payload: { groupId }
  });

  const result = await client.query(queries.checkGroupExists.text, [groupId]);
  if (result.rows.length === 0) {
    // Group not found - this will be handled by the calling function
    throw {
      code: 'NOT_FOUND_ERROR',
      message: 'Group not found',
      field: 'groupId'
    } as NotFoundError;
  }
}

/**
 * Validates if users exist in the database
 * @param userIds Array of user UUIDs to validate
 * @param client Database client for transaction support
 * @returns Array of valid user IDs
 * @throws ValidationError if no valid users found
 */
async function validateUsersExist(userIds: string[], client: any): Promise<string[]> {
  // Publish users validation event
  await createAndPublishEvent({
    eventName: ADD_USERS_TO_GROUP_SERVICE_EVENTS.VALIDATION_USERS.eventName,
    payload: { userCount: userIds.length }
  });
  
  const result = await client.query(queries.checkUsersExist.text, [userIds]);
  const validUserIds = result.rows.map((row: UserIdRow) => row.user_id);

  if (validUserIds.length === 0) {
    // No valid users found - this will be handled by the calling function
    throw {
      code: 'VALIDATION_ERROR',
      message: 'No valid users found',
      field: 'userIds'
    } as ValidationError;
  }
  
  return validUserIds;
}

/**
 * Filters out users who are already members of the group to prevent duplicates
 * @param groupId UUID of the group
 * @param userIds Array of user UUIDs to check
 * @param client Database client for transaction support
 * @returns Array of user IDs not already in the group
 */
async function filterExistingMembers(groupId: string, userIds: string[], client: any): Promise<string[]> {
  const result = await client.query(queries.checkExistingMembers.text, [groupId, userIds]);
  const existingUserIds = result.rows.map((row: UserIdRow) => row.user_id);
  
  const newUserIds = userIds.filter(id => !existingUserIds.includes(id));
  
  return newUserIds;
}

/**
 * Validates user account status and checks if it meets requirements
 * @param userId User UUID to validate
 * @returns Boolean indicating if user can be added to group
 */
async function validateUserAccountStatus(userId: string): Promise<boolean> {
  // Publish account status validation event
  await createAndPublishEvent({
    eventName: ADD_USERS_TO_GROUP_SERVICE_EVENTS.VALIDATION_ACCOUNT_STATUS.eventName,
    payload: { userId }
  });
  
  try {
    // Get account status from helper
    const accountStatus = await getUserAccountStatus(userId);
    
    if (!accountStatus) {
      return false;
    }
    
    // If user is active, allow adding to group
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
 * Main service function to add users to a group
 * @param groupId UUID of the group to add users to
 * @param userIds Array of user UUIDs to add to the group
 * @param addedBy UUID of the user performing the action
 * @returns Promise with response indicating success and count of added users
 */
export async function addUsersToGroup(
  groupId: string,
  userIds: string[],
  addedBy: string
): Promise<AddUsersToGroupResponse> {
  const client = await pool.connect();
  
  try {
    // Publish service initiated event
    await createAndPublishEvent({
      eventName: ADD_USERS_TO_GROUP_SERVICE_EVENTS.SERVICE_INITIATED.eventName,
      payload: { 
        groupId, 
        usersCount: userIds.length,
        addedBy 
      }
    });

    // Validate inputs
    if (!groupId || !userIds || userIds.length === 0 || !addedBy) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Missing required parameters',
        field: !groupId ? 'groupId' : !userIds ? 'userIds' : 'addedBy'
      } as ValidationError;
    }

    // Start transaction
    await client.query('BEGIN');
    
    // Publish transaction start event
    await createAndPublishEvent({
      eventName: ADD_USERS_TO_GROUP_SERVICE_EVENTS.DATABASE_TRANSACTION_START.eventName,
      payload: { groupId }
    });

    // Validate group exists
    await validateGroupExists(groupId, client);
    
    // Validate users exist and get valid user IDs
    const validUserIds = await validateUsersExist(userIds, client);
    
    // Filter out users who are already members
    const newUserIds = await filterExistingMembers(groupId, validUserIds, client);
    
    // If no new users to add after filtering
    if (newUserIds.length === 0) {
      await client.query('COMMIT');
      
      // Publish no change event
      await createAndPublishEvent({
        eventName: ADD_USERS_TO_GROUP_SERVICE_EVENTS.SERVICE_RESPONSE_NO_CHANGE.eventName,
        payload: { groupId }
      });
      
      return {
        success: true,
        message: 'All users are already members of this group',
        count: 0
      };
    }

    // Validate account status for each user and filter out those that don't meet requirements
    const eligibleUserIds = [];
    for (const userId of newUserIds) {
      const isEligible = await validateUserAccountStatus(userId);
      if (isEligible) {
        eligibleUserIds.push(userId);
      }
    }
    
    if (eligibleUserIds.length === 0) {
      await client.query('COMMIT');
      
      return {
        success: false,
        message: 'No eligible users to add due to account status restrictions',
        count: 0
      };
    }

    // Add eligible users to group
    const addedUsers = [];
    
    // Publish database update event
    await createAndPublishEvent({
      eventName: ADD_USERS_TO_GROUP_SERVICE_EVENTS.DATABASE_UPDATE.eventName,
      payload: { 
        groupId, 
        userCount: eligibleUserIds.length 
      }
    });

    for (const userId of eligibleUserIds) {
      const result = await client.query(
        queries.addUserToGroup.text,
        [groupId, userId, addedBy]
      );
      
      if (result.rowCount && result.rowCount > 0) {
        addedUsers.push(userId);
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    
    // Publish database success event
    await createAndPublishEvent({
      eventName: ADD_USERS_TO_GROUP_SERVICE_EVENTS.DATABASE_SUCCESS.eventName,
      payload: { 
        groupId, 
        addedCount: addedUsers.length,
        skippedCount: newUserIds.length - addedUsers.length
      }
    });

    // Check if some users were filtered out due to account status
    const skippedCount = newUserIds.length - addedUsers.length;
    let message = `${addedUsers.length} user(s) successfully added to the group`;
    
    if (skippedCount > 0) {
      message += `, ${skippedCount} user(s) skipped due to account status restrictions`;
    }

    // Publish service success event
    await createAndPublishEvent({
      eventName: ADD_USERS_TO_GROUP_SERVICE_EVENTS.SERVICE_RESPONSE_SUCCESS.eventName,
      payload: { 
        groupId, 
        addedCount: addedUsers.length,
        skippedCount: skippedCount
      }
    });

    return {
      success: true,
      message,
      count: addedUsers.length
    };

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    
    // Publish service error event
    await createAndPublishEvent({
      eventName: ADD_USERS_TO_GROUP_SERVICE_EVENTS.SERVICE_RESPONSE_ERROR.eventName,
      payload: {
        groupId,
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
      message: 'Failed to add users to group',
      details: error instanceof Error ? error.message : String(error)
    } as ServiceError;

  } finally {
    // Release client back to pool
    client.release();
  }
}

export default addUsersToGroup;