/**
 * @file service.view.all.users.ts
 * Service for managing users data operations.
 * 
 * Functionality:
 * - Retrieves users list from cache or database
 * - Maps database records to response format
 * - Updates repository cache with new data
 * - Handles errors and logging
 * 
 * Data flow:
 * 1. Check repository cache
 * 2. If cache valid - return cached data
 * 3. If cache invalid:
 *    - Query database
 *    - Map data to response format
 *    - Update cache
 *    - Return response
 */

import { IUsersResponse, UserError } from './types.view.all.users';
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
            console.log('Cache hit: retrieving users from repository cache');
            const cachedData = await repository.getCachedData();
            console.log(`Sending ${cachedData.users.length} users from cache to frontend`);
            return cachedData;
        }

        // Если кэш недействителен, получаем данные из БД
        console.log('Cache miss: querying database');
        const result = await pool.query(queries.getAllUsers);

        // Обработка данных и применение бизнес-логики
        const users = result.rows.map(row => ({
            user_id: row.user_id,
            username: row.username,
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
        console.log(`Sending ${users.length} users from database to frontend`);

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