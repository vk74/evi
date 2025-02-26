/**
 * controller.update.group.ts
 * Controller for handling group update requests at /api/admin/groups/update-group-by-groupid.
 * Validates request structure, extracts user data, and delegates business logic to the service.
 */

import { Request, Response } from 'express';
import { updateGroupById as updateGroupService } from './service.update.group';
import type { UpdateGroupRequest, ServiceError, UpdateGroupResponse, RequiredFieldError } from './types.group.editor';

function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [UpdateGroup] ${message}`, meta);
}

function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [UpdateGroup] ${message}`, { error, ...meta });
}

async function updateGroupById(req: Request, res: Response): Promise<void> {
  const updateData = req.body as UpdateGroupRequest;

  try {
    logRequest('Received request to update group data', {
      method: req.method,
      url: req.url,
      groupId: updateData.group_id,
      userID: (req as any).user?.user_id || (req as any).user?.id, // Логируем user_id или id из req.user
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

    const result = await updateGroupService({ ...updateData, modified_by: modifiedBy });

    logRequest('Successfully updated group data', {
      groupId: updateData.group_id,
      userID: modifiedBy, // Логируем userID после успешного обновления
    });

    res.status(200).json(result as UpdateGroupResponse);

  } catch (err: unknown) {
    const error = err as ServiceError;

    logError('Error while updating group data', error, {
      groupId: updateData.group_id,
      userID: (req as any).user?.user_id || (req as any).user?.id, // Логируем userID при ошибке
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

module.exports = updateGroupById;