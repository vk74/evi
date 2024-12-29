// controller.view.all.users.ts
import { Request, Response } from 'express';
import { IUsersResponse, UserError } from './types.view.all.users';
import { getAllUsers as getAllUsersService } from './service.view.all.users';

// Вспомогательная функция для логирования
function logRequest(message: string, meta: object): void {
    console.log(`[${new Date().toISOString()}] [ViewAllUsers] ${message}`, meta);
}

// Вспомогательная функция для логирования ошибок
function logError(message: string, error: unknown, meta: object): void {
    console.error(`[${new Date().toISOString()}] [ViewAllUsers] ${message}`, { error, ...meta });
}

// Основная функция-контроллер
async function getAllUsers(req: Request, res: Response): Promise<void> {
    try {
        // Логируем входящий запрос
        logRequest('Received request', {
            method: req.method,
            url: req.url,
            query: req.query
        });

        // JWT проверка уже должна быть выполнена route guards
        // Если запрос дошёл до контроллера, значит JWT валидный

        // Создаем экземпляр сервиса и получаем данные
        // @ts-ignore - игнорируем предупреждение, так как сервис будет реализован позже
        const result: IUsersResponse = await getAllUsersService();

        // Логируем успешное получение данных
        logRequest('Successfully retrieved users data', {
            userCount: result.users.length
        });

        // Отправка ответа
        res.status(200).json(result);
        
    } catch (error) {
        // Логирование ошибки
        logError('Error while fetching users list', error, {});

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

module.exports = getAllUsers;