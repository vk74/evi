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
import { createSystemLgr, Lgr } from '../../lgr/lgr.index';
import { Events } from '../../lgr/codes';

const pool = pgPool as Pool;

// Types for database results
interface UserIdRow {
  user_id: string;
}

// Create lgr for service
const lgr: Lgr = createSystemLgr({
  module: 'AddUsersToGroupService',
  fileName: 'service.add.users.to.group.ts'
});

/**
 * Validates if a group exists in the database
 * @param groupId UUID of the group to validate
 * @param client Database client for transaction support
 * @throws NotFoundError if group doesn't exist
 */
async function validateGroupExists(groupId: string, client: any): Promise<void> {
  lgr.info({
    code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.SUCCESS.code,
    message: 'Validating group existence',
    details: { groupId }
  });

  const result = await client.query(queries.checkGroupExists.text, [groupId]);
  if (result.rows.length === 0) {
    lgr.error({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.GROUP_NOT_FOUND.code,
      message: 'Group not found during validation',
      details: { groupId }
    });
    
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
  lgr.info({
    code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.SUCCESS.code,
    message: 'Validating user existence',
    details: { userCount: userIds.length }
  });
  
  const result = await client.query(queries.checkUsersExist.text, [userIds]);
  const validUserIds = result.rows.map((row: UserIdRow) => row.user_id);
  
  lgr.info({
    code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.SUCCESS.code,
    message: 'Users validation complete',
    details: { 
      requestedCount: userIds.length, 
      validCount: validUserIds.length 
    }
  });

  if (validUserIds.length === 0) {
    lgr.error({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.USERS_NOT_FOUND.code,
      message: 'No valid users found during validation',
      details: { 
        userIds 
      }
    });
    
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
  lgr.info({
    code: Events.CORE.ITEM_SELECTOR.ADD_USERS.PROCESS.INITIATED.code,
    message: 'Checking for existing group members',
    details: { 
      groupId, 
      userCount: userIds.length 
    }
  });

  const result = await client.query(queries.checkExistingMembers.text, [groupId, userIds]);
  const existingUserIds = result.rows.map((row: UserIdRow) => row.user_id);
  
  const newUserIds = userIds.filter(id => !existingUserIds.includes(id));
  
  lgr.info({
    code: Events.CORE.ITEM_SELECTOR.ADD_USERS.PROCESS.SUCCESS.code,
    message: 'Filtered existing members',
    details: { 
      existingCount: existingUserIds.length,
      newCount: newUserIds.length
    }
  });
  
  return newUserIds;
}

/**
 * Validates user account status and checks if it meets requirements
 * @param userId User UUID to validate
 * @returns Boolean indicating if user can be added to group
 */
async function validateUserAccountStatus(userId: string): Promise<boolean> {
  lgr.info({
    code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.ACCOUNT_STATUS_START.code,
    message: 'Validating user account status',
    details: { userId }
  });
  
  try {
    // Get account status from helper
    const accountStatus = await getUserAccountStatus(userId);
    
    if (!accountStatus) {
      lgr.warn({
        code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.ACCOUNT_NOT_FOUND.code,
        message: 'User not found for account status check',
        details: { userId }
      });
      return false;
    }
    
    // If user is active, allow adding to group
    if (accountStatus === 'active') {
      lgr.info({
        code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.ACCOUNT_STATUS_ACTIVE.code,
        message: 'User has active account status',
        details: { userId, accountStatus }
      });
      return true;
    }
    
    // For non-active users, check application settings
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.ACCOUNT_STATUS_INACTIVE.code,
      message: 'User has non-active account status',
      details: { userId, accountStatus }
    });
    
    // Get setting from the correct cache - default to true for safety
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.ACCOUNT_STATUS_CHECK_SETTINGS.code,
      message: 'Checking application settings for non-active users',
      details: { userId }
    });
    
    const settingPath = 'Application.UsersManagement.GroupsManagement';
    const settingName = 'add.only.active.users.to.groups';
    const setting = getSetting(settingPath, settingName);
    
    // Default to true (only active users) if setting not found
    let onlyAddActiveUsers = true;
    
    if (setting) {
      onlyAddActiveUsers = parseSettingValue(setting) === true;
    }
    
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.ACCOUNT_STATUS_CHECK_SETTINGS.code,
      message: 'Checked settings for adding non-active users',
      details: { 
        userId, 
        onlyAddActiveUsers 
      }
    });
    
    // If setting is true, only active users can be added to groups
    if (onlyAddActiveUsers) {
      lgr.info({
        code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.ACCOUNT_STATUS_INACTIVE.code,
        message: 'Cannot add non-active user to group due to settings',
        details: { 
          userId, 
          accountStatus 
        }
      });
      return false;
    }
    
    // If setting is false, allow adding non-active users
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.SUCCESS.code,
      message: 'Non-active user allowed by settings',
      details: { userId, accountStatus }
    });
    return true;
  } catch (error) {
    lgr.error({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.ACCOUNT_STATUS_ERROR.code,
      message: 'Error validating user account status',
      error,
      details: { 
        userId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    });
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
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.PROCESS.INITIATED.code,
      message: 'Starting process to add users to group',
      details: { 
        groupId, 
        usersCount: userIds.length,
        addedBy 
      }
    });

    // Validate inputs
    if (!groupId || !userIds || userIds.length === 0 || !addedBy) {
      lgr.error({
        code: Events.CORE.ITEM_SELECTOR.ADD_USERS.REQUEST.INVALID.code,
        message: 'Missing required parameters',
        details: { 
          groupId, 
          usersCount: userIds?.length || 0, 
          addedBy 
        }
      });
      
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Missing required parameters',
        field: !groupId ? 'groupId' : !userIds ? 'userIds' : 'addedBy'
      } as ValidationError;
    }

    // Start transaction
    await client.query('BEGIN');
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.PROCESS.INITIATED.code,
      message: 'Database transaction started'
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
      lgr.info({
        code: Events.CORE.ITEM_SELECTOR.ADD_USERS.PROCESS.SUCCESS.code,
        message: 'No new users to add, all are already members',
        details: { groupId }
      });
      
      return {
        success: true,
        message: 'All users are already members of this group',
        count: 0
      };
    }

    // Validate account status for each user and filter out those that don't meet requirements
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.ACCOUNT_STATUS_START.code,
      message: 'Validating account status for users',
      details: { count: newUserIds.length }
    });
    
    const eligibleUserIds = [];
    for (const userId of newUserIds) {
      const isEligible = await validateUserAccountStatus(userId);
      if (isEligible) {
        eligibleUserIds.push(userId);
      } else {
        lgr.info({
          code: Events.CORE.ITEM_SELECTOR.ADD_USERS.VALIDATE.ACCOUNT_STATUS_INACTIVE.code,
          message: 'User excluded due to account status',
          details: { userId }
        });
      }
    }
    
    if (eligibleUserIds.length === 0) {
      await client.query('COMMIT');
      lgr.info({
        code: Events.CORE.ITEM_SELECTOR.ADD_USERS.PROCESS.SUCCESS.code,
        message: 'No eligible users to add after account status check',
        details: { 
          groupId,
          originalCount: newUserIds.length
        }
      });
      
      return {
        success: false,
        message: 'No eligible users to add due to account status restrictions',
        count: 0
      };
    }

    // Add eligible users to group
    const addedUsers = [];
    
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.PROCESS.INITIATED.code,
      message: 'Adding eligible users to group',
      details: { 
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
    
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.PROCESS.SUCCESS.code,
      message: 'Users successfully added to group',
      details: { 
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

    return {
      success: true,
      message,
      count: addedUsers.length
    };

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    lgr.error({
      code: Events.CORE.ITEM_SELECTOR.ADD_USERS.PROCESS.ERROR.code,
      message: 'Failed to add users to group',
      error,
      details: {
        groupId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorDetails: (error as ServiceError).code ? error : null
      }
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
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.DATABASE.CLIENT_RELEASED.code,
      message: 'Database client released'
    });
  }
}

export default addUsersToGroup;