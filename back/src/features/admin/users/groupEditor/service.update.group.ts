/**
 * service.update.group.ts - version 1.0.02
 * Service for handling group update business logic and database operations.
 * Performs validation using common backend rules, updates group data in app.groups and app.group_details, and manages transactions.
 * Uses event bus for tracking operations and enhancing observability.
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.group.editor';
import type { UpdateGroupRequest, UpdateGroupResponse, ServiceError, ValidationError, NotFoundError } from './types.group.editor';
import { REGEX, VALIDATION } from '../../../../core/validation/rules.common.fields';
import { groupsRepository } from '../groupsList/repository.groups.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_UPDATE_EVENTS } from './events.group.editor';

const pool = pgPool as Pool;

export async function updateGroupById(updateData: UpdateGroupRequest, req: Request): Promise<UpdateGroupResponse> {
  // Получаем UUID пользователя, делающего запрос
  const requestorUuid = getRequestorUuidFromReq(req);

  // Создаем событие для начала обновления группы
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_UPDATE_EVENTS.REQUEST_RECEIVED.eventName,
    payload: { 
      groupId: updateData.group_id,
      requestorUuid
    }
  });

  // Валидация group_name, если он передан, используя общие правила
  if (updateData.group_name !== undefined) { // Проверяем, что поле передано (включая null/empty)
    if (!updateData.group_name) {
      // Создаем событие для ошибки валидации
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          field: 'group_name',
          message: VALIDATION.GROUP_NAME.MESSAGES.REQUIRED
        },
        errorData: 'Group name is empty'
      });

      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.REQUIRED,
        field: 'group_name',
        details: 'Group name is empty',
      } as ValidationError;
    }
    if (updateData.group_name.length < VALIDATION.GROUP_NAME.MIN_LENGTH) {
      // Создаем событие для ошибки валидации
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          field: 'group_name',
          message: VALIDATION.GROUP_NAME.MESSAGES.MIN_LENGTH,
          length: updateData.group_name.length,
          minLength: VALIDATION.GROUP_NAME.MIN_LENGTH
        },
        errorData: `Group name must be at least ${VALIDATION.GROUP_NAME.MIN_LENGTH} characters long`
      });

      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.MIN_LENGTH,
        field: 'group_name',
        details: `Group name must be at least ${VALIDATION.GROUP_NAME.MIN_LENGTH} characters long`,
      } as ValidationError;
    }
    if (updateData.group_name.length > VALIDATION.GROUP_NAME.MAX_LENGTH) {
      // Создаем событие для ошибки валидации
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          field: 'group_name',
          message: VALIDATION.GROUP_NAME.MESSAGES.MAX_LENGTH,
          length: updateData.group_name.length,
          maxLength: VALIDATION.GROUP_NAME.MAX_LENGTH
        },
        errorData: `Group name cannot exceed ${VALIDATION.GROUP_NAME.MAX_LENGTH} characters`
      });

      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.MAX_LENGTH,
        field: 'group_name',
        details: `Group name cannot exceed ${VALIDATION.GROUP_NAME.MAX_LENGTH} characters`,
      } as ValidationError;
    }
    if (!REGEX.GROUP_NAME.test(updateData.group_name)) {
      // Создаем событие для ошибки валидации
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.VALIDATION_FAILED.eventName,
        payload: {
          field: 'group_name',
          message: VALIDATION.GROUP_NAME.MESSAGES.INVALID_CHARS,
          pattern: REGEX.GROUP_NAME.toString()
        },
        errorData: 'Group name can only contain Latin letters, numbers, and hyphens'
      });

      throw {
        code: 'VALIDATION_ERROR',
        message: VALIDATION.GROUP_NAME.MESSAGES.INVALID_CHARS,
        field: 'group_name',
        details: 'Group name can only contain Latin letters, numbers, and hyphens',
      } as ValidationError;
    }
  }

  // Создаем событие для успешной валидации
  await fabricEvents.createAndPublishEvent({
    req,
    eventName: GROUP_UPDATE_EVENTS.VALIDATION_PASSED.eventName,
    payload: { 
      groupId: updateData.group_id,
      requestorUuid
    }
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Создаем событие для начала транзакции
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_UPDATE_EVENTS.TRANSACTION_START.eventName,
      payload: { 
        groupId: updateData.group_id,
        requestorUuid
      }
    });

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
      // Создаем событие для ошибки "группа не найдена"
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.FAILED.eventName,
        payload: {
          groupId: updateData.group_id,
          error: {
            code: 'NOT_FOUND',
            message: 'Group not found'
          }
        },
        errorData: 'No group found with the provided group_id'
      });

      throw {
        code: 'NOT_FOUND',
        message: 'Group not found',
        details: 'No group found with the provided group_id',
      } as NotFoundError;
    }

    // Подготовка параметров для обновления app.group_details
    const detailsParams = [
      updateData.group_id,
      updateData.group_description || null,
      updateData.group_email || null,
      requestorUuid || updateData.modified_by // Используем UUID пользователя из запроса или переданный modified_by
    ];

    // Обновление данных группы в app.group_details
    const detailsResult = await client.query(
      queries.updateGroupDetailsById,
      detailsParams
    );

    if (detailsResult.rowCount === 0) {
      // Создаем событие для ошибки "детали группы не найдены"
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.FAILED.eventName,
        payload: {
          groupId: updateData.group_id,
          error: {
            code: 'NOT_FOUND',
            message: 'Group details not found'
          }
        },
        errorData: 'No group details found for the provided group_id'
      });

      throw {
        code: 'NOT_FOUND',
        message: 'Group details not found',
        details: 'No group details found for the provided group_id',
      } as NotFoundError;
    }

    await client.query('COMMIT');
    
    // Создаем событие для успешного обновления группы
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_UPDATE_EVENTS.COMPLETE.eventName,
      payload: { 
        groupId: updateData.group_id,
        requestorUuid
      }
    });
    
    // Очищаем кэш списка групп
    try {
      groupsRepository.clearCache();
      
      // Проверяем очистку кэша
      const cacheStateAfter = groupsRepository.hasValidCache();
      
      if (!cacheStateAfter) {
        // Создаем событие для успешной очистки кэша
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: GROUP_UPDATE_EVENTS.CACHE_CLEARED.eventName,
          payload: { 
            groupId: updateData.group_id,
            requestorUuid 
          }
        });
      } else {
        // Создаем событие для ошибки очистки кэша
        await fabricEvents.createAndPublishEvent({
          req,
          eventName: GROUP_UPDATE_EVENTS.CACHE_CLEAR_FAILED.eventName,
          payload: { 
            groupId: updateData.group_id,
            error: 'Cache is still valid after clearing',
            requestorUuid 
          },
          errorData: 'Failed to clear cache: cache still valid'
        });
      }
    } catch (error) {
      // Создаем событие для ошибки очистки кэша
      await fabricEvents.createAndPublishEvent({
        req,
        eventName: GROUP_UPDATE_EVENTS.CACHE_CLEAR_FAILED.eventName,
        payload: { 
          groupId: updateData.group_id,
          error: error instanceof Error ? error.message : String(error),
          requestorUuid 
        },
        errorData: error instanceof Error ? error.message : String(error)
      });
    }

    return {
      success: true,
      message: 'Group updated successfully',
      groupId: updateData.group_id, // Используем UpdateGroupResponse-совместимый объект
    };

  } catch (err: unknown) {
    await client.query('ROLLBACK');

    const error = err as ServiceError;
    
    if ((error as ServiceError).code) {
      // Если это наша ошибка с кодом, просто пробрасываем дальше
      throw error;
    }

    // Создаем событие для неожиданной ошибки
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_UPDATE_EVENTS.FAILED.eventName,
      payload: {
        groupId: updateData.group_id,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update group data'
        }
      },
      errorData: error instanceof Error ? error.message : String(error)
    });

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