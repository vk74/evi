/**
 * @file service.groups.list.ts
 * Service for managing groups data operations.
 *
 * Functionality:
 * - Retrieves groups list from cache or database
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

import { IGroupsResponse, GroupError } from './types.groups.list';
import { groupsRepository } from './repository.groups.list';
import { queries } from './queries.groups.list';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';

// Явно указываем тип для pool
const pool = pgPool as Pool;

export async function getAllGroups(): Promise<IGroupsResponse> {
    try {
        const repository = groupsRepository;

        // Проверяем наличие данных в кэше
        const isCacheValid = await repository.hasValidCache();
        if (isCacheValid) {
            console.log('Cache hit: retrieving groups from repository cache');
            const cachedData = await repository.getCachedData();
            console.log(`Sending ${cachedData.groups.length} groups from cache to frontend`);
            return cachedData;
        }

        // Если кэш недействителен, получаем данные из БД
        console.log('Cache miss: querying database');
        const result = await pool.query(queries.getAllGroups);

        // Обработка данных и применение бизнес-логики
        const groups = result.rows.map(row => ({
            group_id: row.group_id,
            group_name: row.group_name,
            reserve_1: row.reserve_1,
            group_status: row.group_status,
            group_owner: row.group_owner,
            is_system: row.is_system
        }));

        const response: IGroupsResponse = {
            groups,
            total: groups.length
        };

        // Сохраняем результат в кэш
        await repository.setCacheData(response);
        console.log(`Sending ${groups.length} groups from database to frontend`);

        return response;

    } catch (error) {
        console.error('Service error while fetching groups:', error);
        throw {
            code: 'SERVICE_ERROR',
            message: 'Error while processing groups data',
            details: error
        } as GroupError;
    }
}