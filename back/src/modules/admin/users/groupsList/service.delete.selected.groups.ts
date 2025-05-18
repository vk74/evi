/**
 * @file service.delete.selected.groups.ts - version 1.0.02
 * Backend service for deleting selected groups.
 *
 * Functionality:
 * - Deletes selected groups from the database.
 * - Clears the cache after successful deletion.
 * - Uses event bus for tracking operations and error handling.
 * - Accepts request object for access to user context.
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../core/db/maindb';
import { queries } from './queries.groups.list';
import { groupsRepository } from './repository.groups.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';
import fabricEvents from '../../../../core/eventBus/fabric.events';
import { GROUPS_DELETE_EVENTS } from './events.groups.list';

// Явно указываем тип для pool
const pool = pgPool as Pool;

/**
 * Backend service for deleting selected groups
 */
export const deleteSelectedGroupsService = {
    /**
     * Deletes selected groups by their IDs
     * @param groupIds - Array of group UUIDs to delete
     * @param req - Express request object for context
     * @returns Promise<number> - Number of deleted groups
     * @throws {Error} - If an error occurs
     */
    async deleteSelectedGroups(groupIds: string[], req: Request): Promise<number> {
        try {
            // Получаем UUID пользователя, делающего запрос
            const requestorUuid = getRequestorUuidFromReq(req);
            
            // Создаем событие для начала операции удаления
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: GROUPS_DELETE_EVENTS.REQUEST_RECEIVED.eventName,
                payload: {
                    groupIds,
                    requestorUuid
                }
            });

            // Выполняем SQL-запрос для удаления групп
            const result = await pool.query(queries.deleteSelectedGroups, [groupIds]);

            // Проверяем результат
            if (!result.rows || !Array.isArray(result.rows)) {
                const errorMessage = 'Invalid database response format';
                
                // Создаем событие для ошибки
                await fabricEvents.createAndPublishEvent({
                    req,
                    eventName: GROUPS_DELETE_EVENTS.FAILED.eventName,
                    payload: {
                        error: errorMessage
                    },
                    errorData: errorMessage
                });
                
                throw new Error(errorMessage);
            }

            // Получаем количество удаленных групп
            const deletedCount = result.rows.length;
            
            // Создаем событие для успешного удаления
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: GROUPS_DELETE_EVENTS.COMPLETE.eventName,
                payload: {
                    deletedCount,
                    requestorUuid
                }
            });

            // Очищаем кэш в репозитории
            groupsRepository.clearCache();

            // Проверяем, что кэш действительно очищен
            const isCacheCleared = !groupsRepository.hasValidCache();
            if (isCacheCleared) {
                // Создаем событие для успешного очищения кэша
                await fabricEvents.createAndPublishEvent({
                    req,
                    eventName: GROUPS_DELETE_EVENTS.CACHE_INVALIDATED.eventName,
                    payload: { requestorUuid }
                });
            } else {
                // Создаем событие для неудачного очищения кэша
                await fabricEvents.createAndPublishEvent({
                    req,
                    eventName: GROUPS_DELETE_EVENTS.CACHE_INVALIDATION_FAILED.eventName,
                    payload: { requestorUuid }
                });
            }

            // Возвращаем количество удаленных групп
            return deletedCount;

        } catch (error) {
            // Создаем событие для ошибки при удалении
            await fabricEvents.createAndPublishEvent({
                req,
                eventName: GROUPS_DELETE_EVENTS.FAILED.eventName,
                payload: {
                    error: 'Error during groups deletion'
                },
                errorData: error instanceof Error ? error.message : String(error)
            });

            // Пробрасываем ошибку дальше
            throw new Error(
                process.env.NODE_ENV === 'development' ?
                    (error instanceof Error ? error.message : String(error)) :
                    'Failed to delete selected groups'
            );
        }
    }
};

export default deleteSelectedGroupsService;