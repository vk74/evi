/**
 * @file service.groups.list.ts - version 1.0.01
 * Service for managing groups data operations.
 *
 * Functionality:
 * - Retrieves groups list from cache or database
 * - Maps database records to response format
 * - Updates repository cache with new data
 * - Handles errors and logging
 * - Now accepts request object for context access
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

import { Request } from 'express';
import { IGroupsResponse, GroupError } from './types.groups.list';
import { groupsRepository } from './repository.groups.list';
import { queries } from './queries.groups.list';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';

// Явно указываем тип для pool
const pool = pgPool as Pool;

export async function getAllGroups(req: Request): Promise<IGroupsResponse> {
    try {
        const repository = groupsRepository;
        
        // Получаем UUID пользователя, делающего запрос
        const requestorUuid = getRequestorUuidFromReq(req);
        console.log(`[GroupsService] Processing request from user UUID: ${requestorUuid}`);

        // Проверяем наличие данных в кэше
        const isCacheValid = await repository.hasValidCache();
        if (isCacheValid) {
            console.log(`[GroupsService] Cache hit: retrieving groups from repository cache for user ${requestorUuid}`);
            const cachedData = await repository.getCachedData();
            console.log(`[GroupsService] Sending ${cachedData.groups.length} groups from cache to frontend`);
            return cachedData;
        }

        // Если кэш недействителен, получаем данные из БД
        console.log(`[GroupsService] Cache miss: querying database for user ${requestorUuid}`);
        const result = await pool.query(queries.getAllGroups);

        // Обработка данных и применение бизнес-логики
        const groups = result.rows.map(row => ({
            group_id: row.group_id,
            group_name: row.group_name,
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
        console.log(`[GroupsService] Sending ${groups.length} groups from database to frontend for user ${requestorUuid}`);

        return response;

    } catch (error) {
        console.error('[GroupsService] Service error while fetching groups:', error);
        throw {
            code: 'SERVICE_ERROR',
            message: 'Error while processing groups data',
            details: error
        } as GroupError;
    }
}