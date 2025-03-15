/**
 * @file service.change.group.owner.ts
 * BACKEND Service for changing the owner of a group in the database.
 * 
 * Functionality:
 * - Validates input data (group and user existence)
 * - Handles database operations
 * - Manages transactions for atomic updates
 * - Provides comprehensive error handling
 * - Returns formatted response with old owner ID
 */
import { Pool } from 'pg';
import { pool as pgPool } from '../../../db/maindb';
import { queries } from './queries.item.selector';
import type { 
  ChangeGroupOwnerResponse,
  ServiceError, 
  ValidationError,
  NotFoundError
} from './types.item.selector';

const pool = pgPool as Pool;

// Types for database result rows
interface OwnerIdRow {
  group_owner: string;
}

interface UserIdRow {
  user_id: string;
}

interface UpdatedRow {
  group_id: string;
}

// Logger for tracking operations
const logger = {
  info: (message: string, meta?: object) => 
    console.log(`[ChangeGroupOwnerService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => 
    console.error(`[ChangeGroupOwnerService] ${message}`, error || '', error ? '' : '')
};

/**
 * Validates if a group exists in the database and returns its current owner
 * @param groupId UUID of the group to validate
 * @param client Database client for transaction support
 * @returns The current owner UUID of the group
 * @throws NotFoundError if group doesn't exist
 */
async function validateGroupAndGetCurrentOwner(groupId: string, client: any): Promise<string> {
  logger.info('Validating group existence and getting current owner', { groupId });

  const result = await client.query(queries.checkGroupExists.text, [groupId]);
  if (result.rows.length === 0) {
    logger.error(`Group not found - ID: ${groupId}`);
    throw {
      code: 'NOT_FOUND_ERROR',
      message: 'Group not found',
      field: 'groupId'
    } as NotFoundError;
  }

  // Get the current owner
  const ownerResult = await client.query(queries.getCurrentGroupOwner.text, [groupId]);
  return ownerResult.rows[0].group_owner;
}

/**
 * Validates if the new owner exists as a user in the database
 * @param userId UUID of the user to validate
 * @param client Database client for transaction support
 * @throws ValidationError if user doesn't exist
 */
async function validateUserExists(userId: string, client: any): Promise<void> {
  logger.info('Validating new owner existence', { userId });
  
  const result = await client.query(queries.checkUserExists.text, [userId]);
  if (result.rows.length === 0) {
    logger.error(`User not found - ID: ${userId}`);
    throw {
      code: 'VALIDATION_ERROR',
      message: 'New owner user not found',
      field: 'newOwnerId'
    } as ValidationError;
  }
}

/**
 * Main service function to change the owner of a group
 * @param groupId UUID of the group
 * @param newOwnerId UUID of the new owner
 * @param changedBy UUID of the user performing the action
 * @returns Promise with response indicating success and the old owner ID
 */
export async function changeGroupOwner(
  groupId: string,
  newOwnerId: string,
  changedBy: string
): Promise<ChangeGroupOwnerResponse> {
  const client = await pool.connect();
  
  try {
    logger.info('Starting process to change group owner', { 
      groupId, 
      newOwnerId,
      changedBy 
    });

    // Validate inputs
    if (!groupId || !newOwnerId || !changedBy) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Missing required parameters',
        field: !groupId ? 'groupId' : !newOwnerId ? 'newOwnerId' : 'changedBy'
      } as ValidationError;
    }

    // Start transaction
    await client.query('BEGIN');
    logger.info('Database transaction started');

    // Validate group exists and get current owner
    const currentOwnerId = await validateGroupAndGetCurrentOwner(groupId, client);
    
    // Validate new owner exists
    await validateUserExists(newOwnerId, client);
    
    // If current owner is the same as new owner, no need to update
    if (currentOwnerId === newOwnerId) {
      await client.query('COMMIT');
      logger.info('New owner is the same as current owner, no update needed');
      
      return {
        success: true,
        message: 'The specified user is already the owner of this group',
        oldOwnerId: currentOwnerId
      };
    }

    // Update the group owner
    logger.info('Updating group owner', { 
      groupId, 
      currentOwnerId,
      newOwnerId 
    });

    const updateResult = await client.query(
      queries.updateGroupOwner.text,
      [groupId, newOwnerId]
    );
    
    if (!updateResult.rowCount || updateResult.rowCount === 0) {
      throw {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update group owner',
        details: 'No rows were updated'
      } as ServiceError;
    }

    // Update the group details (modified timestamp and user)
    await client.query(
      queries.updateGroupDetails.text,
      [groupId, changedBy]
    );

    // Commit transaction
    await client.query('COMMIT');
    
    logger.info('Group owner successfully changed', { 
      groupId, 
      oldOwnerId: currentOwnerId,
      newOwnerId
    });

    return {
      success: true,
      message: 'Group owner successfully changed',
      oldOwnerId: currentOwnerId
    };

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    logger.error('Failed to change group owner', error);
    
    if ((error as ServiceError).code) {
      throw error;
    }

    // Format unknown errors
    throw {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to change group owner',
      details: error instanceof Error ? error.message : String(error)
    } as ServiceError;

  } finally {
    // Release client back to pool
    client.release();
    logger.info('Database client released');
  }
}

export default changeGroupOwner;