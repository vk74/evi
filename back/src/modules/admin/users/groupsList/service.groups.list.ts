/**
 * @file service.groups.list.ts - version 1.0.02
 * Service for managing groups data operations.
 *
 * Functionality:
 * - Retrieves groups list from cache or database
 * - Maps database records to response format
 * - Updates repository cache with new data
 * - Uses event bus to track operations and enhance observability
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
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUPS_FETCH_EVENTS } from './events.groups.list';

// Явно указываем тип для pool
const pool = pgPool as Pool;

export async function getAllGroups(req: Request): Promise<IGroupsResponse> {
    try {
        const repository = groupsRepository;
        
        // Получаем UUID пользователя, делающего запрос
        const requestorUuid = getRequestorUuidFromReq(req);
        
        // Создаем событие для получения запроса на получение списка групп
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: GROUPS_FETCH_EVENTS.REQUEST_RECEIVED.eventName,
            payload: { requestorUuid }
        });

        // Проверяем наличие данных в кэше
        const isCacheValid = await repository.hasValidCache();
        if (isCacheValid) {
            const cachedData = await repository.getCachedData();
            
            // Создаем событие для использования кэша
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: GROUPS_FETCH_EVENTS.CACHE_HIT.eventName,
                payload: { 
                    requestorUuid,
                    groupCount: cachedData.groups.length 
                }
            });
            
            return cachedData;
        }

        // Если кэш недействителен, получаем данные из БД
        // Создаем событие для кэш-мисса и обращения к БД
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: GROUPS_FETCH_EVENTS.CACHE_MISS.eventName,
            payload: { requestorUuid }
        });
        
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
        
        // Создаем событие для успешного получения данных из БД
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: GROUPS_FETCH_EVENTS.COMPLETE.eventName,
            payload: { 
                count: groups.length,
                requestorUuid 
            }
        });

        return response;

    } catch (error) {
        // Создаем событие для ошибки при получении данных
        await fabricEvents.createAndPublishEvent({
            req,
            eventName: GROUPS_FETCH_EVENTS.FAILED.eventName,
            payload: {
                error: {
                    code: 'SERVICE_ERROR',
                    message: 'Error while processing groups data'
                }
            },
            errorData: error instanceof Error ? error.message : String(error)
        });
        
        throw {
            code: 'SERVICE_ERROR',
            message: 'Error while processing groups data',
            details: error
        } as GroupError;
    }
}