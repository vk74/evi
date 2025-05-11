/**
 * controller.update.group.ts - version 1.0.03
 * Controller for handling group update requests at /api/admin/groups/update-group-by-groupid.
 * Validates request structure, extracts user data, and delegates business logic to the service.
 * Now uses event bus for tracking operations and enhancing observability.
 */

import { Request, Response } from 'express';
import { updateGroupById as updateGroupService } from './service.update.group';
import type { UpdateGroupRequest, ServiceError, UpdateGroupResponse, RequiredFieldError } from './types.group.editor';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUP_UPDATE_CONTROLLER_EVENTS } from './events.group.editor';

async function updateGroupById(req: Request, res: Response): Promise<void> {
  const updateData = req.body as UpdateGroupRequest;

  try {
    // Создаем событие для входящего запроса
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_UPDATE_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
      payload: {
        groupId: updateData.group_id,
        method: req.method,
        url: req.url,
        userID: (req as any).user?.user_id || (req as any).user?.id
      }
    });

    // Извлекаем user_id (UUID пользователя) из req.user
    const modifiedBy = (req as any).user?.user_id; // Используем user_id, добавленное validateJWT
    if (!modifiedBy) {
      throw {
        code: 'REQUIRED_FIELD_ERROR',
        message: 'User not authenticated or missing user ID',
        details: 'No user_id found in request',
      } as RequiredFieldError;
    }

    // Передаем req в сервис
    const result = await updateGroupService({ ...updateData, modified_by: modifiedBy }, req);
    
    // Создаем событие для успешного ответа
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_UPDATE_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
      payload: {
        groupId: updateData.group_id,
        success: result.success,
        userID: modifiedBy
      }
    });

    res.status(200).json(result as UpdateGroupResponse);

  } catch (err: unknown) {
    const error = err as ServiceError;

    // Создаем событие для ошибки
    await fabricEvents.createAndPublishEvent({
      req,
      eventName: GROUP_UPDATE_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
      payload: {
        groupId: updateData.group_id,
        errorCode: error.code || 'UNKNOWN_ERROR',
        userID: (req as any).user?.user_id || (req as any).user?.id
      },
      errorData: error instanceof Error ? error.message : String(error)
    });

    let statusCode: number;
    if ((error as any).code === 'NOT_FOUND') {
      statusCode = 404;
    } else {
      statusCode = 500;
    }

    const errorResponse = {
      success: false,
      message: error.message || 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : 
        undefined,
    };

    res.status(statusCode).json(errorResponse);
  }
}

// Export using ES modules syntax
export default updateGroupById;