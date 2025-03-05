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
import { pool as pgPool } from '../../../db/maindb';
import { queries } from './queries.item.selector';
import type { 
  AddUsersToGroupResponse,
  ServiceError, 
  ValidationError,
  NotFoundError
} from './types.item.selector';

const pool = pgPool as Pool;

// Types for database results
interface UserIdRow {
  user_id: string;
}

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => 
    console.log(`[AddUsersToGroupService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => 
    console.error(`[AddUsersToGroupService] ${message}`, error || '', error ? '' : '')
};

/**
 * Validates if a group exists in the database
 * @param groupId UUID of the group to validate
 * @param client Database client for transaction support
 * @throws NotFoundError if group doesn't exist
 */
async function validateGroupExists(groupId: string, client: any): Promise<void> {
  logger.info('Validating group existence', { groupId });

  const result = await client.query(queries.checkGroupExists.text, [groupId]);
  if (result.rows.length === 0) {
    logger.error(`Group not found - ID: ${groupId}`);
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
  logger.info('Validating user existence', { userCount: userIds.length });
  
  const result = await client.query(queries.checkUsersExist.text, [userIds]);
  const validUserIds = result.rows.map((row: UserIdRow) => row.user_id);
  
  logger.info('Users validation complete', { 
    requestedCount: userIds.length, 
    validCount: validUserIds.length 
  });

  if (validUserIds.length === 0) {
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
  logger.info('Checking for existing group members', { 
    groupId, 
    userCount: userIds.length 
  });

  const result = await client.query(queries.checkExistingMembers.text, [groupId, userIds]);
  const existingUserIds = result.rows.map((row: UserIdRow) => row.user_id);
  
  const newUserIds = userIds.filter(id => !existingUserIds.includes(id));
  
  logger.info('Filtered existing members', { 
    existingCount: existingUserIds.length,
    newCount: newUserIds.length
  });
  
  return newUserIds;
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
    logger.info('Starting process to add users to group', { 
      groupId, 
      usersCount: userIds.length,
      addedBy 
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
    logger.info('Database transaction started');

    // Validate group exists
    await validateGroupExists(groupId, client);
    
    // Validate users exist and get valid user IDs
    const validUserIds = await validateUsersExist(userIds, client);
    
    // Filter out users who are already members
    const newUserIds = await filterExistingMembers(groupId, validUserIds, client);
    
    // If no new users to add after filtering
    if (newUserIds.length === 0) {
      await client.query('COMMIT');
      logger.info('No new users to add, all are already members');
      
      return {
        success: true,
        message: 'All users are already members of this group',
        count: 0
      };
    }

    // Add users to group
    const addedUsers = [];
    
    logger.info('Adding users to group', { 
      groupId, 
      userCount: newUserIds.length 
    });

    for (const userId of newUserIds) {
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
    
    logger.info('Users successfully added to group', { 
      groupId, 
      addedCount: addedUsers.length 
    });

    return {
      success: true,
      message: `${addedUsers.length} user(s) successfully added to the group`,
      count: addedUsers.length
    };

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    logger.error('Failed to add users to group', error);
    
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
    logger.info('Database client released');
  }
}

export default addUsersToGroup;