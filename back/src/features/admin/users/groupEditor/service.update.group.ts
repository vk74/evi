/**
 * service.update.group.ts
 * Service for handling group update business logic and database operations.
 * Performs validation using common backend rules, updates group data in app.groups and app.group_details, and manages transactions.
 */

import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.group.editor';
import type { UpdateGroupRequest, UpdateGroupResponse, ServiceError, ValidationError, NotFoundError } from './types.group.editor';
import { REGEX, VALIDATION } from '../../../../core/validation/rules.common.fields';

const pool = pgPool as Pool;

function logService(message: string, meta?: object): void {
  console.log(`[${new Date().toISOString()}] [UpdateGroupService] ${message}`, meta || '');
}

export async function updateGroupById(updateData: UpdateGroupRequest): Promise<UpdateGroupResponse> {
  // Валидация group_name, если он передан, используя общие правила
  if (updateData.group_name !== undefined) { // Проверяем, что поле передано (включая null/empty)
    if (!updateData.group_name) {
      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.REQUIRED,
        field: 'group_name',
        details: 'Group name is empty', // Добавляем details
      } as ValidationError;
    }
    if (updateData.group_name.length < VALIDATION.GROUP_NAME.MIN_LENGTH) {
      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.MIN_LENGTH,
        field: 'group_name',
        details: `Group name must be at least ${VALIDATION.GROUP_NAME.MIN_LENGTH} characters long`, // Добавляем details
      } as ValidationError;
    }
    if (updateData.group_name.length > VALIDATION.GROUP_NAME.MAX_LENGTH) {
      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.MAX_LENGTH,
        field: 'group_name',
        details: `Group name cannot exceed ${VALIDATION.GROUP_NAME.MAX_LENGTH} characters`, // Добавляем details
      } as ValidationError;
    }
    if (!REGEX.GROUP_NAME.test(updateData.group_name)) {
      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.INVALID_CHARS,
        field: 'group_name',
        details: 'Group name can only contain Latin letters, numbers, and hyphens', // Добавляем details
      } as ValidationError;
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    logService('Starting group update transaction', { groupId: updateData.group_id });

    // Подготовка параметров для обновления app.groups
    // Передаём null для неуказанных полей, COALESCE в запросе сохранит текущие значения
    const groupParams = [
      updateData.group_id, // $1: group_id (обязательное)
      updateData.group_name || null, // $2: group_name (может быть null)
      updateData.group_status || null, // $3: group_status (может быть null, COALESCE сохранит текущее значение)
      updateData.group_owner || null, // $4: group_owner (может быть null, COALESCE сохранит текущее значение)
    ];

    // Обновление данных группы в app.groups
    const groupResult = await client.query(
      queries.updateGroupById,
      groupParams
    );

    if (groupResult.rowCount === 0) {
      throw {
        code: 'NOT_FOUND',
        message: 'Group not found',
        details: 'No group found with the provided group_id', // Добавляем details
      } as NotFoundError;
    }

    // Подготовка параметров для обновления app.group_details
    const detailsParams = [
      updateData.group_id,
      updateData.group_description || null,
      updateData.group_email || null,
      updateData.modified_by, // UUID пользователя, выполняющего обновление
    ];

    // Обновление данных группы в app.group_details
    const detailsResult = await client.query(
      queries.updateGroupDetailsById,
      detailsParams
    );

    if (detailsResult.rowCount === 0) {
      throw {
        code: 'NOT_FOUND',
        message: 'Group details not found',
        details: 'No group details found for the provided group_id', // Добавляем details
      } as NotFoundError;
    }

    await client.query('COMMIT');
    logService('Successfully updated group data', { groupId: updateData.group_id });

    return {
      success: true,
      message: 'Group updated successfully',
      groupId: updateData.group_id, // Используем UpdateGroupResponse-совместимый объект
    };

  } catch (err: unknown) {
    await client.query('ROLLBACK');

    const error = err as ServiceError;

    logService('Error updating group data', { groupId: updateData.group_id, error });

    throw {
      code: error?.code || 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Failed to update group data',
      details: error instanceof Error ? error.message : String(error), // Убедимся, что details — строка
    } as ServiceError;

  } finally {
    client.release();
  }
}

export default updateGroupById;