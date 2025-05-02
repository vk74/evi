/**
 * service.create.group.ts - version 1.0.01
 * Backend service layer for handling group creation operations.
 * 
 * Handles:
 * - Input validation
 * - Database operations
 * - Transaction management
 * - Error handling
 * - Clear cache after successful group creation
 * - Now accepts request object for access to user context
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.group.editor';
import { GroupStatus } from './types.group.editor';
import { groupsRepository } from '../groupsList/repository.groups.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import type { 
  CreateGroupRequest, 
  CreateGroupResponse,
  ValidationError,
  UniqueCheckError,
  RequiredFieldError,
  ServiceError
} from './types.group.editor';
import { 
  createAppLgr,
  Events 
} from '../../../../core/lgr/lgr.index';

const pool = pgPool as Pool;

// Создаем экземпляр логгера для сервиса групп
const lgr = createAppLgr({
  module: 'AdminGroupService',
  fileName: 'service.create.group.ts'
});

// Validation functions
async function validateRequiredFields(data: CreateGroupRequest): Promise<void> {
  lgr.debug({
    code: Events.ADMIN.USERS.CREATION.VALIDATE.SUCCESS.code,
    message: 'Validating required fields'
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
    lgr.warn({
      code: Events.ADMIN.USERS.CREATION.VALIDATE.REQUIRED_FIELD.code,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      details: { missingFields }
    });

    throw {
      code: 'REQUIRED_FIELD_ERROR',
      message: `Missing required fields: ${missingFields.join(', ')}`,
      field: missingFields[0].toLowerCase()
    } as RequiredFieldError;
  }
}

function validateGroupName(name: string): void {
  lgr.debug({
    code: Events.ADMIN.USERS.CREATION.VALIDATE.SUCCESS.code,
    message: 'Validating group name format',
    details: { name }
  });

  if (name.length < 2) {
    lgr.warn({
      code: Events.ADMIN.USERS.CREATION.VALIDATE.NAME_FORMAT.code,
      message: 'Group name too short',
      details: { name, length: name.length, minLength: 2 }
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Minimum group name length is 2 characters',
      field: 'group_name'
    } as ValidationError;
  }

  if (name.length > 100) {
    lgr.warn({
      code: Events.ADMIN.USERS.CREATION.VALIDATE.NAME_FORMAT.code,
      message: 'Group name too long',
      details: { name, length: name.length, maxLength: 100 }
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Maximum group name length is 100 characters',
      field: 'group_name'
    } as ValidationError;
  }

  if (!/^[a-zA-Z0-9-]+$/.test(name)) {
    lgr.warn({
      code: Events.ADMIN.USERS.CREATION.VALIDATE.NAME_FORMAT.code,
      message: 'Group name contains invalid characters',
      details: { name, pattern: '^[a-zA-Z0-9-]+$' }
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Group name can only contain latin letters, numbers and hyphens',
      field: 'group_name'
    } as ValidationError;
  }
}

function validateEmail(email: string | undefined): void {
  if (!email) return;

  lgr.debug({
    code: Events.ADMIN.USERS.CREATION.VALIDATE.SUCCESS.code,
    message: 'Validating email format',
    details: { email }
  });

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  if (!emailRegex.test(email) || email.length > 254) {
    lgr.warn({
      code: Events.ADMIN.USERS.CREATION.VALIDATE.EMAIL_FORMAT.code,
      message: 'Invalid email format',
      details: { email, length: email.length, maxLength: 254 }
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Invalid email format',
      field: 'group_email'
    } as ValidationError;
  }
}

function validateDescription(description: string | undefined): void {
  if (!description) return;

  lgr.debug({
    code: Events.ADMIN.USERS.CREATION.VALIDATE.SUCCESS.code,
    message: 'Validating description format',
    details: { descriptionLength: description.length }
  });

  if (description.length > 5000) {
    lgr.warn({
      code: Events.ADMIN.USERS.CREATION.VALIDATE.DESCRIPTION_FORMAT.code,
      message: 'Description too long',
      details: { length: description.length, maxLength: 5000 }
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Maximum description length is 5000 characters',
      field: 'group_description'
    } as ValidationError;
  }

  if (!/^[a-zA-Zа-яА-ЯёЁ0-9\s\-_.,!?()@#$%&'*+=/<>[\]{}"`~;:|]+$/.test(description)) {
    lgr.warn({
      code: Events.ADMIN.USERS.CREATION.VALIDATE.DESCRIPTION_FORMAT.code,
      message: 'Description contains invalid characters',
      details: { descriptionLength: description.length }
    });

    throw {
      code: 'VALIDATION_ERROR',
      message: 'Description contains invalid characters',
      field: 'group_description'
    } as ValidationError;
  }
}

async function checkUniqueness(groupName: string): Promise<void> {
  lgr.debug({
    code: Events.ADMIN.USERS.CREATION.CHECK.NAME_EXISTS.code,
    message: 'Checking group name uniqueness',
    details: { groupName }
  });

  const result = await pool.query(queries.checkGroupName.text, [groupName]);
  if (result.rows.length > 0) {
    lgr.warn({
      code: Events.ADMIN.USERS.CREATION.CHECK.NAME_EXISTS.code,
      message: 'Group name already exists',
      details: { groupName, existingGroup: result.rows[0] }
    });

    throw {
      code: 'UNIQUE_CONSTRAINT_ERROR',
      message: 'Group name is already taken',
      field: 'group_name'
    } as UniqueCheckError;
  }
}

async function checkOwnerExists(ownerUsername: string): Promise<void> {
  lgr.debug({
    code: Events.ADMIN.USERS.CREATION.CHECK.OWNER_NOT_FOUND.code,
    message: 'Checking if owner exists',
    details: { ownerUsername }
  });

  const result = await pool.query(queries.checkUserExists.text, [ownerUsername]);
  if (result.rows.length === 0) {
    lgr.warn({
      code: Events.ADMIN.USERS.CREATION.CHECK.OWNER_NOT_FOUND.code,
      message: 'Group owner does not exist',
      details: { ownerUsername }
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
    // Получаем UUID пользователя, делающего запрос
    const requestorUuid = getRequestorUuidFromReq(req);
    
    lgr.info({
      code: Events.ADMIN.USERS.CREATION.CREATE.SUCCESS.code,
      message: 'Starting group creation process',
      details: { 
        groupName: groupData.group_name,
        owner: groupData.group_owner,
        initiatedBy: currentUser.username,
        requestorUuid
      }
    });

    // Validation
    await validateRequiredFields(groupData);
    validateGroupName(groupData.group_name);
    validateEmail(groupData.group_email);
    validateDescription(groupData.group_description);
    
    if (!Object.values(GroupStatus).includes(groupData.group_status)) {
      lgr.warn({
        code: Events.ADMIN.USERS.CREATION.VALIDATE.STATUS_FORMAT.code,
        message: 'Invalid group status',
        details: { 
          providedStatus: groupData.group_status,
          allowedStatuses: Object.values(GroupStatus),
          requestorUuid
        }
      });

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
    lgr.debug({
      code: Events.ADMIN.USERS.CREATION.DATABASE.TRANSACTION_START.code,
      message: 'Starting database transaction',
      details: { requestorUuid }
    });
    
    // Получаем UUID владельца
    const ownerResult = await client.query(
      queries.getUserId.text,
      [groupData.group_owner]
    );
    lgr.debug({
      code: Events.ADMIN.USERS.CREATION.DATABASE.SUCCESS.code,
      message: 'Owner query completed',
      details: { ownerData: ownerResult.rows[0], requestorUuid }
    });
    
    const ownerUuid = ownerResult.rows[0].user_id;
    
    // Создаем группу с полученным UUID
    const groupResult = await client.query(
      queries.insertGroup.text,
      [
        groupData.group_name,    
        groupData.group_status,  
        ownerUuid,               
        false                   
      ]
    );
    
    const groupId = groupResult.rows[0].group_id;
    lgr.debug({
      code: Events.ADMIN.USERS.CREATION.DATABASE.SUCCESS.code,
      message: 'Group base data inserted',
      details: { groupId, requestorUuid }
    });

    // Create group details
    await client.query(
      queries.insertGroupDetails.text,
      [
        groupId,
        groupData.group_description || null,
        groupData.group_email || null,
        requestorUuid // Используем UUID того, кто выполняет запрос
      ]
    );
    lgr.debug({
      code: Events.ADMIN.USERS.CREATION.DATABASE.SUCCESS.code,
      message: 'Group details inserted',
      details: { groupId, requestorUuid }
    });

    await client.query('COMMIT');
    lgr.info({
      code: Events.ADMIN.USERS.CREATION.DATABASE.SUCCESS.code,
      message: 'Group database transaction committed',
      details: { groupId, groupName: groupData.group_name, requestorUuid }
    });

    try {
      // Очищаем кэш
      groupsRepository.clearCache(); 
      
      // Проверяем состояние кеша
      const cacheStateAfter = groupsRepository.hasValidCache();
      
      if (!cacheStateAfter) {
        lgr.info({
          code: Events.ADMIN.USERS.CREATION.CACHE.CLEARED.code,
          message: 'Groups list repository cache cleared successfully',
          details: { requestorUuid }
        });
      } else {
        lgr.warn({
          code: Events.ADMIN.USERS.CREATION.CACHE.ERROR.code,
          message: 'Failed to clear groups list repository cache: cache is still valid',
          details: { requestorUuid }
        });
      }
    } catch (error) {
      lgr.error({
        code: Events.ADMIN.USERS.CREATION.CACHE.ERROR.code,
        message: 'Failed to clear groups list repository cache',
        details: { requestorUuid },
        error
      });
    }

    return {
      success: true,
      message: 'Group created successfully',
      groupId,
      group_name: groupData.group_name
    };

  } catch (error) {
    await client.query('ROLLBACK');
    
    if ((error as ServiceError).code) {
      lgr.error({
        code: Events.ADMIN.USERS.CREATION.CREATE.ERROR.code,
        message: `Group creation failed: ${(error as Error).message}`,
        details: { 
          groupName: groupData.group_name,
          errorType: (error as ServiceError).code
        },
        error
      });
      throw error;
    }

    lgr.error({
      code: Events.ADMIN.USERS.CREATION.DATABASE.ERROR.code,
      message: 'Unexpected error during group creation',
      details: { 
        groupName: groupData.group_name,
        errorMessage: error instanceof Error ? error.message : String(error)
      },
      error
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