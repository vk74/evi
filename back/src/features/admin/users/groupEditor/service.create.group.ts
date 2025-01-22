/**
 * service.create.group.ts - backend
 * Service layer for handling group creation operations.
 * 
 * Handles:
 * - Input validation
 * - Database operations
 * - Transaction management
 * - Error handling
 */

import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.group.editor';
import { GroupStatus } from './types.group.editor';
import type { 
  CreateGroupRequest, 
  CreateGroupResponse,
  ValidationError,
  UniqueCheckError,
  RequiredFieldError,
  ServiceError
} from './types.group.editor';

const pool = pgPool as Pool;

// Logger configuration
const logger = {
  info: (message: string, meta?: object) => 
    console.log(`[CreateGroupService] ${message}`, meta || ''),
  error: (message: string, error?: unknown) => 
    console.error(`[CreateGroupService] ${message}`, error || '')
};

// Validation functions
async function validateRequiredFields(data: CreateGroupRequest): Promise<void> {
  logger.info('Validating required fields');
  
  const requiredFields = {
    group_name: 'Group name',
    group_status: 'Group status',
    group_owner: 'Group owner'
  } as const;

  const missingFields = Object.entries(requiredFields)
    .filter(([field]) => !data[field as keyof typeof requiredFields])
    .map(([, label]) => label);

  if (missingFields.length > 0) {
    throw {
      code: 'REQUIRED_FIELD_ERROR',
      message: `Missing required fields: ${missingFields.join(', ')}`,
      field: missingFields[0].toLowerCase()
    } as RequiredFieldError;
  }
}

function validateGroupName(name: string): void {
  logger.info('Validating group name format');

  if (name.length < 2) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Minimum group name length is 2 characters',
      field: 'group_name'
    } as ValidationError;
  }

  if (name.length > 100) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Maximum group name length is 100 characters',
      field: 'group_name'
    } as ValidationError;
  }

  if (!/^[a-zA-Z0-9-]+$/.test(name)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Group name can only contain latin letters, numbers and hyphens',
      field: 'group_name'
    } as ValidationError;
  }
}

function validateEmail(email: string | undefined): void {
  logger.info('Validating email format');
  
  if (!email) return;

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  if (!emailRegex.test(email) || email.length > 254) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Invalid email format',
      field: 'group_email'
    } as ValidationError;
  }
}

function validateDescription(description: string | undefined): void {
  logger.info('Validating description format');
  
  if (!description) return;

  if (description.length > 5000) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Maximum description length is 5000 characters',
      field: 'group_description'
    } as ValidationError;
  }

  if (!/^[a-zA-Zа-яА-ЯёЁ0-9\s\-_.,!?()@#$%&'*+=/<>[\]{}"`~;:|]+$/.test(description)) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Description contains invalid characters',
      field: 'group_description'
    } as ValidationError;
  }
}

async function checkUniqueness(groupName: string): Promise<void> {
  logger.info('Checking group name uniqueness', { groupName });

  const result = await pool.query(queries.checkGroupName.text, [groupName]);
  if (result.rows.length > 0) {
    throw {
      code: 'UNIQUE_CONSTRAINT_ERROR',
      message: 'Group name is already taken',
      field: 'group_name'
    } as UniqueCheckError;
  }
}

async function checkOwnerExists(ownerUsername: string): Promise<void> {
  logger.info('Checking if owner exists', { ownerUsername });

  const result = await pool.query(queries.checkUserExists.text, [ownerUsername]);
  if (result.rows.length === 0) {
    throw {
      code: 'VALIDATION_ERROR',
      message: 'Group owner does not exist',
      field: 'group_owner'
    } as ValidationError;
  }
}

export async function createGroup(
  groupData: CreateGroupRequest, 
  currentUser: { username: string }
): Promise<CreateGroupResponse> {
  const client = await pool.connect();
  
  try {
    logger.info('Starting group creation process', { 
      groupName: groupData.group_name,
      owner: groupData.group_owner 
    });

    // Validation
    await validateRequiredFields(groupData);
    validateGroupName(groupData.group_name);
    validateEmail(groupData.group_email);
    validateDescription(groupData.group_description);
    
    if (!Object.values(GroupStatus).includes(groupData.group_status)) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Invalid group status',
        field: 'group_status'
      } as ValidationError;
    }

    // Database checks
    await checkUniqueness(groupData.group_name);
    await checkOwnerExists(groupData.group_owner);

    // Start transaction
    await client.query('BEGIN');
    logger.info('Starting database transaction');
    
    // Получаем UUID владельца
    const ownerResult = await client.query(
      queries.getUserId.text,
      [groupData.group_owner]
    );
    logger.info('Owner query result:', ownerResult.rows[0]); // добавим лог
    
    const ownerUuid = ownerResult.rows[0].user_id;
    logger.info('Owner UUID:', ownerUuid); // и ещё один лог
    
    const params = [
      groupData.group_name,    
      groupData.group_status,  
      ownerUuid,              
      false                   
    ];
    logger.info('Insert group parameters:', params);
    logger.info('Insert group query:', { query: queries.insertGroup.text });

    // Создаем группу с полученным UUID
    const groupResult = await client.query(
      queries.insertGroup.text,
      [
        groupData.group_name,    
        groupData.group_status,  
        ownerUuid,              // используем полученный UUID    
        false                   
      ]
    );
    
    const groupId = groupResult.rows[0].group_id;

    // Create group details
    await client.query(
      queries.insertGroupDetails.text,
      [
        groupId,
        groupData.group_description || null,
        groupData.group_email || null,
        ownerUuid,  // Используем UUID вместо username
        // убираем now() так как он теперь в запросе
      ]
    );

    await client.query('COMMIT');
    logger.info('Group created successfully', { groupId });

    return {
      success: true,
      message: 'Group created successfully',
      groupId,
      group_name: groupData.group_name
    };

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to create group', error);
    
    if ((error as ServiceError).code) {
      throw error;
    }

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