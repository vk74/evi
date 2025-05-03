/**
 * @file controller.delete.selected.groups.ts - version 1.0.02
 * Controller for handling group deletion requests.
 *
 * Functionality:
 * - Handles HTTP POST requests to delete selected groups.
 * - Validates the request body.
 * - Calls the service to delete groups, passing the request object.
 * - Sends the response back to the client.
 * - Uses event bus to track operations and enhance observability.
 */

import { Request, Response } from 'express';
import { deleteSelectedGroupsService } from './service.delete.selected.groups';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUPS_DELETE_CONTROLLER_EVENTS } from './events.groups.list';

/**
 * Handles the deletion of selected groups
 * @param req - Express request object
 * @param res - Express response object
 */
async function deleteSelectedGroups(req: Request, res: Response): Promise<void> {
    try {
        // Создаем событие для входящего запроса
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: GROUPS_DELETE_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
            payload: {
                method: req.method,
                url: req.url,
                body: req.body
            }
        });

        // Проверяем наличие groupIds в теле запроса
        const { groupIds } = req.body;
        if (!groupIds || !Array.isArray(groupIds)) {
            // Создаем событие для невалидного запроса
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: GROUPS_DELETE_CONTROLLER_EVENTS.INVALID_REQUEST.eventName,
                payload: null
            });
            
            res.status(400).json({ error: 'Invalid request body: groupIds is required and must be an array' });
            return;
        }

        // Вызываем сервис для удаления групп, передавая объект req
        const deletedCount = await deleteSelectedGroupsService.deleteSelectedGroups(groupIds, req);

        // Создаем событие для успешного ответа
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: GROUPS_DELETE_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
            payload: { deletedCount }
        });

        // Отправляем ответ клиенту
        res.status(200).json({ deletedCount });

    } catch (error) {
        // Создаем событие для ошибки
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: GROUPS_DELETE_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
            payload: {
                error: 'Failed to delete selected groups'
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

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