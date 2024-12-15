import { Request, Response } from 'express';
import { IUsersResponse, UserError } from './types.view.all.users';
import { getAllUsers as getAllUsersService } from './service.view.all.users';

// Вспомогательная функция для валидации заголовков
function validateHeaders(req: Request): boolean {
    const requiredHeaders = [
        'x-request-id',
        'content-type'
    ];

    return requiredHeaders.every(header => req.headers[header] !== undefined);
}

// Вспомогательная функция для логирования
function logRequest(message: string, meta: object): void {
    console.log(`[${new Date().toISOString()}] ${message}`, meta);
}

// Вспомогательная функция для логирования ошибок
function logError(message: string, error: unknown, meta: object): void {
    console.error(`[${new Date().toISOString()}] ${message}`, { error, ...meta });
}

// Основная функция-контроллер
async function getAllUsers(req: Request, res: Response): Promise<void> {
    try {
        // Валидация заголовков
        if (!validateHeaders(req)) {
            const error: UserError = {
                code: 'INVALID_HEADERS',
                message: 'Invalid request headers'
            };
            res.status(400).json(error);
            return;
        }

        // Логирование запроса
        logRequest('Requesting all users list', {
            requestId: req.headers['x-request-id'],
        });

        // Создаем экземпляр сервиса и получаем данные
        // @ts-ignore - игнорируем предупреждение, так как сервис будет реализован позже
        const result: IUsersResponse = await getAllUsersService();

        // Отправка ответа
        res.status(200).json(result);

    } catch (error) {
        // Логирование ошибки
        logError('Error while fetching users list', error, {
            requestId: req.headers['x-request-id']
        });

        // Формирование ответа с ошибкой
        const userError: UserError = {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An error occurred while processing your request',
            details: process.env.NODE_ENV === 'development' ? error : undefined
        };

        res.status(500).json(userError);
    }
}

module.exports = getAllUsers;