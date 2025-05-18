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
import { pool as pgPool } from '../../db/maindb';
import { queries } from './queries.item.selector';
import { 
  createAppLgr,
  Events 
} from '../../../core/lgr/lgr.index';
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

// Create lgr for the service
const lgr = createAppLgr({
  module: 'ItemSelectorService',
  fileName: 'service.change.group.owner.ts'
});

/**
 * Validates if a group exists in the database and returns its current owner
 * @param groupId UUID of the group to validate
 * @param client Database client for transaction support
 * @returns The current owner UUID of the group
 * @throws NotFoundError if group doesn't exist
 */
async function validateGroupAndGetCurrentOwner(groupId: string, client: any): Promise<string> {
  lgr.debug({
    code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.VALIDATE.GROUP.code,
    message: 'Validating group existence and getting current owner',
    details: { groupId }
  });

  const result = await client.query(queries.checkGroupExists.text, [groupId]);
  if (result.rows.length === 0) {
    lgr.warn({
      code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.VALIDATE.GROUP_NOT_FOUND.code,
      message: 'Group not found during owner change operation',
      details: { groupId }
    });

    throw {
      code: 'NOT_FOUND_ERROR',
      message: 'Group not found',
      field: 'groupId'
    } as NotFoundError;
  }

  // Get the current owner
  const ownerResult = await client.query(queries.getCurrentGroupOwner.text, [groupId]);
  
  lgr.debug({
    code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.VALIDATE.SUCCESS.code,
    message: 'Successfully found group and current owner',
    details: { 
      groupId, 
      currentOwner: ownerResult.rows[0].group_owner 
    }
  });
  
  return ownerResult.rows[0].group_owner;
}

/**
 * Validates if the new owner exists as a user in the database
 * @param userId UUID of the user to validate
 * @param client Database client for transaction support
 * @throws ValidationError if user doesn't exist
 */
async function validateUserExists(userId: string, client: any): Promise<void> {
  lgr.debug({
    code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.VALIDATE.USER.code,
    message: 'Validating new owner existence',
    details: { userId }
  });
  
  const result = await client.query(queries.checkUserExists.text, [userId]);
  if (result.rows.length === 0) {
    lgr.warn({
      code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.VALIDATE.USER_NOT_FOUND.code,
      message: 'New owner user not found',
      details: { userId }
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'New owner user not found',
      field: 'newOwnerId'
    } as ValidationError;
  }
  
  lgr.debug({
    code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.VALIDATE.SUCCESS.code,
    message: 'Successfully validated new owner existence',
    details: { userId }
  });
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
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.CHANGE.INITIATED.code,
      message: 'Starting process to change group owner',
      details: { 
        groupId, 
        newOwnerId,
        changedBy 
      }
    });

    // Validate inputs
    if (!groupId || !newOwnerId || !changedBy) {
      const missingField = !groupId ? 'groupId' : !newOwnerId ? 'newOwnerId' : 'changedBy';
      
      lgr.warn({
        code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.VALIDATE.REQUIRED_FIELD.code,
        message: 'Missing required parameter for group owner change',
        details: { 
          missingField,
          groupId, 
          newOwnerId,
          changedBy
        }
      });

      throw {
        code: 'VALIDATION_ERROR',
        message: 'Missing required parameters',
        field: missingField
      } as ValidationError;
    }

    // Start transaction
    await client.query('BEGIN');
    lgr.debug({
      code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.DATABASE.TRANSACTION_START.code,
      message: 'Database transaction started for group owner change'
    });

    // Validate group exists and get current owner
    const currentOwnerId = await validateGroupAndGetCurrentOwner(groupId, client);
    
    // Validate new owner exists
    await validateUserExists(newOwnerId, client);
    
    // If current owner is the same as new owner, no need to update
    if (currentOwnerId === newOwnerId) {
      await client.query('COMMIT');
      
      lgr.info({
        code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.CHANGE.NO_CHANGE.code,
        message: 'New owner is the same as current owner, no update needed',
        details: { 
          groupId, 
          ownerId: currentOwnerId 
        }
      });
      
      return {
        success: true,
        message: 'The specified user is already the owner of this group',
        oldOwnerId: currentOwnerId
      };
    }

    // Update the group owner
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.CHANGE.UPDATING.code,
      message: 'Updating group owner',
      details: { 
        groupId, 
        currentOwnerId,
        newOwnerId 
      }
    });

    const updateResult = await client.query(
      queries.updateGroupOwner.text,
      [groupId, newOwnerId]
    );
    
    if (!updateResult.rowCount || updateResult.rowCount === 0) {
      lgr.error({
        code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.DATABASE.ERROR.code,
        message: 'Failed to update group owner - no rows were updated',
        details: { 
          groupId, 
          newOwnerId,
          updateResult 
        }
      });

      throw {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update group owner',
        details: 'No rows were updated'
      } as ServiceError;
    }

    // Update the group details (modified timestamp and user)
    const detailsResult = await client.query(
      queries.updateGroupDetails.text,
      [groupId, changedBy]
    );
    
    lgr.debug({
      code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.DATABASE.SUCCESS.code,
      message: 'Successfully updated group details with modification info',
      details: { 
        groupId,
        changedBy,
        detailsUpdated: detailsResult.rowCount ? detailsResult.rowCount > 0 : false
      }
    });

    // Commit transaction
    await client.query('COMMIT');
    
    lgr.info({
      code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.CHANGE.SUCCESS.code,
      message: 'Group owner successfully changed',
      details: { 
        groupId, 
        oldOwnerId: currentOwnerId,
        newOwnerId
      }
    });

    return {
      success: true,
      message: 'Group owner successfully changed',
      oldOwnerId: currentOwnerId
    };

  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    
    lgr.error({
      code: Events.CORE.ITEM_SELECTOR.GROUP_OWNER.CHANGE.ERROR.code,
      message: 'Failed to change group owner',
      details: { 
        groupId, 
        newOwnerId,
        errorCode: (error as ServiceError).code || 'UNKNOWN_ERROR'
      },
      error
    });
    
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
    lgr.debug({
      code: Events.CORE.ITEM_SELECTOR.DATABASE.CLIENT_RELEASED.code,
      message: 'Database client released'
    });
  }
}

export default changeGroupOwner;