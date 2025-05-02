/**
 * @file controller.groups.list.ts - version 1.0.01
 * Controller for fetching groups list.
 *
 * Handles HTTP requests to the /api/admin/groups/fetch-groups endpoint.
 * Validates JWT (if needed), retrieves data from the service, and sends the response.
 * Now passes the request object to service layer.
 */

import { Request, Response } from 'express';
import { getAllGroups } from './service.groups.list';
import { IGroupsResponse, GroupError } from './types.groups.list';

// Вспомогательная функция для логирования
function logRequest(message: string, meta: object): void {
    console.log(`[${new Date().toISOString()}] [FetchGroups] ${message}`, meta);
}

// Вспомогательная функция для логирования ошибок
function logError(message: string, error: unknown, meta: object): void {
    console.error(`[${new Date().toISOString()}] [FetchGroups] ${message}`, { error, ...meta });
}

/**
 * Основная функция-контроллер для получения списка групп.
 * @param req - Объект запроса Express.
 * @param res - Объект ответа Express.
 */
async function fetchGroups(req: Request, res: Response): Promise<void> {
    try {
        // Логируем входящий запрос
        logRequest('Received request', {
            method: req.method,
            url: req.url,
            query: req.query
        });

        // JWT проверка уже должна быть выполнена route guards
        // Если запрос дошёл до контроллера, значит JWT валидный

        // Получаем данные из сервиса, передавая объект req
        const result: IGroupsResponse = await getAllGroups(req);

        // Логируем успешное получение данных
        logRequest('Successfully retrieved groups data', {
            groupCount: result.groups.length
        });

        // Отправка ответа
        res.status(200).json(result);

    } catch (error) {
        // Логирование ошибки
        logError('Error while fetching groups list', error, {});

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