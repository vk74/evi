/**
 * @file controller.delete.selected.users.ts
 * Controller for handling deletion of selected users.
 *
 * Functionality:
 * - Receives request with array of user IDs to delete
 * - Validates request format
 * - Calls delete service
 * - Returns operation result
 */

import { Request, Response } from 'express';
import { IDeleteUsersRequest, IDeleteUsersResponse, UserError } from './types.view.all.users';
import { deleteSelectedUsers as deleteSelectedUsersService } from './service.delete.selected.users';

// Вспомогательная функция для логирования
function logRequest(message: string, meta: object): void {
  console.log(`[${new Date().toISOString()}] [DeleteSelectedUsers] ${message}`, meta);
}

// Вспомогательная функция для логирования ошибок
function logError(message: string, error: unknown, meta: object): void {
  console.error(`[${new Date().toISOString()}] [DeleteSelectedUsers] ${message}`, { error, ...meta });
}

// Основная функция-контроллер
async function deleteSelectedUsers(req: Request, res: Response): Promise<void> {
  try {
    // Логируем входящий запрос
    logRequest('Received delete request', {
      method: req.method,
      url: req.url,
      body: req.body
    });

    // Валидация формата входящих данных
    if (!req.body.userIds || !Array.isArray(req.body.userIds) || req.body.userIds.length === 0) {
      logError('Invalid request format', null, { body: req.body });
      res.status(400).json({
        code: 'INVALID_REQUEST',
        message: 'Request must contain non-empty array of user IDs'
      } as UserError);
      return;
    }

    // Вызов сервиса удаления
    const result: IDeleteUsersResponse = await deleteSelectedUsersService(req.body as IDeleteUsersRequest);

    // Логируем успешное выполнение
    logRequest('Successfully deleted users', {
      deletedCount: result.deletedCount
    });

    // Отправка ответа
    res.status(200).json(result);

  } catch (error) {
    // Логирование ошибки
    logError('Error while deleting users', error, {});

    // Формирование ответа с ошибкой
    const userError: UserError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while processing your request',
      details: process.env.NODE_ENV === 'development' ? 
        (error instanceof Error ? error.message : String(error)) : 
        undefined
    };

    res.status(500).json(userError);
  }
}

module.exports = deleteSelectedUsers;