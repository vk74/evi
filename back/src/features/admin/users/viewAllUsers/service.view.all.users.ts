import { IUsersResponse, IUser, UserError } from './types.view.all.users';
import { usersRepository } from './repository.view.all.users';
import { queries } from './queries.view.all.users';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';

// Явно указываем тип для pool
const pool = pgPool as Pool;

export async function getAllUsers(): Promise<IUsersResponse> {
    try {
        const repository = usersRepository;

        // Проверяем наличие данных в кэше
        const isCacheValid = await repository.hasValidCache();
        
        if (isCacheValid) {
            console.log('Cache hit: retrieving users from cache');
            return await repository.getCachedData();
        }

        // Если кэш недействителен, получаем данные из БД
        console.log('Cache miss: querying database');
        const result = await pool.query(queries.getAllUsers);
        
        // Обработка данных и применение бизнес-логики
        const users = result.rows.map(row => ({
            user_id: row.user_id,
            user_name: row.user_name,
            email: row.email,
            is_staff: row.is_staff,
            account_status: row.account_status,
            first_name: row.first_name,
            middle_name: row.middle_name,
            last_name: row.last_name
        }));

        const response: IUsersResponse = {
            users,
            total: users.length
        };

        // Сохраняем результат в кэш
        await repository.setCacheData(response);

        return response;

    } catch (error) {
        console.error('Service error while fetching users:', error);
        throw {
            code: 'SERVICE_ERROR',
            message: 'Error while processing users data',
            details: error
        } as UserError;
    }
}