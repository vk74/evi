/**
 * @file controller.delete.selected.groups.ts
 * Controller for handling group deletion requests.
 *
 * Functionality:
 * - Handles HTTP POST requests to delete selected groups.
 * - Validates the request body.
 * - Calls the service to delete groups.
 * - Sends the response back to the client.
 */

import { Request, Response } from 'express';
import { deleteSelectedGroupsService } from './service.delete.selected.groups';

// Вспомогательная функция для логирования
function logRequest(message: string, meta: object): void {
    console.log(`[DeleteGroupsController] ${message}`, meta);
}

// Вспомогательная функция для логирования ошибок
function logError(message: string, error: unknown, meta: object): void {
    console.error(`[DeleteGroupsController] ${message}`, { error, ...meta });
}

/**
 * Handles the deletion of selected groups
 * @param req - Express request object
 * @param res - Express response object
 */
async function deleteSelectedGroups(req: Request, res: Response): Promise<void> {
    try {
        // Логируем входящий запрос
        logRequest('Received request', {
            method: req.method,
            url: req.url,
            body: req.body
        });

        // Проверяем наличие groupIds в теле запроса
        const { groupIds } = req.body;
        if (!groupIds || !Array.isArray(groupIds)) {
            const errorMessage = 'Invalid request body: groupIds is required and must be an array';
            logError(errorMessage, {}, {});
            res.status(400).json({ error: errorMessage });
            return;
        }

        // Вызываем сервис для удаления групп
        const deletedCount = await deleteSelectedGroupsService.deleteSelectedGroups(groupIds);

        // Логируем успешное выполнение
        logRequest('Successfully deleted groups', { deletedCount });

        // Отправляем ответ клиенту
        res.status(200).json({ deletedCount });

    } catch (error) {
        // Логируем ошибку
        logError('Error during groups deletion', error, {});

        // Отправляем ошибку клиенту
        res.status(500).json({
            error: 'Failed to delete selected groups',
            details: process.env.NODE_ENV === 'development' ?
                (error instanceof Error ? error.message : String(error)) :
                undefined
        });
    }
}

export default deleteSelectedGroups;