/**
 * @file controller.groups.list.ts - version 1.0.02
 * Controller for fetching groups list.
 *
 * Handles HTTP requests to the /api/admin/groups/fetch-groups endpoint.
 * Validates JWT (if needed), retrieves data from the service, and sends the response.
 * Uses event bus to track operations and enhance observability.
 */

import { Request, Response } from 'express';
import { getAllGroups } from './service.groups.list';
import { IGroupsResponse, GroupError } from './types.groups.list';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUPS_FETCH_CONTROLLER_EVENTS } from './events.groups.list';

/**
 * Основная функция-контроллер для получения списка групп.
 * @param req - Объект запроса Express.
 * @param res - Объект ответа Express.
 */
async function fetchGroups(req: Request, res: Response): Promise<void> {
    try {
        // Создаем событие для входящего запроса
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: GROUPS_FETCH_CONTROLLER_EVENTS.HTTP_REQUEST_RECEIVED.eventName,
            payload: {
                method: req.method,
                url: req.url,
                query: req.query
            }
        });

        // JWT проверка уже должна быть выполнена route guards
        // Если запрос дошёл до контроллера, значит JWT валидный

        // Получаем данные из сервиса, передавая объект req
        const result: IGroupsResponse = await getAllGroups(req);

        // Создаем событие для успешного ответа
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: GROUPS_FETCH_CONTROLLER_EVENTS.HTTP_RESPONSE_SENT.eventName,
            payload: {
                groupCount: result.groups.length
            }
        });

        // Отправка ответа
        res.status(200).json(result);

    } catch (error) {
        // Создаем событие для ошибки
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: GROUPS_FETCH_CONTROLLER_EVENTS.HTTP_ERROR.eventName,
            payload: {
                errorCode: (error as GroupError)?.code || 'INTERNAL_SERVER_ERROR'
            },
            errorData: error instanceof Error ? error.message : String(error)
        });

        // Формирование ответа с ошибкой
        const groupError: GroupError = {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while processing your request',
            details: process.env.NODE_ENV === 'development' ?
                (error instanceof Error ? error.message : String(error)) :
                undefined
        };

        res.status(500).json(groupError);
    }
}

// Экспортируем функцию контроллера
export default fetchGroups;