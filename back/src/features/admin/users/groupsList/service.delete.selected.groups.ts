/**
 * @file service.delete.selected.groups.ts - version 1.0.01
 * Backend service for deleting selected groups.
 *
 * Functionality:
 * - Deletes selected groups from the database.
 * - Clears the cache after successful deletion.
 * - Handles errors and logging.
 * - Now accepts request object for access to user context.
 */

import { Request } from 'express';
import { Pool } from 'pg';
import { pool as pgPool } from '../../../../db/maindb';
import { queries } from './queries.groups.list';
import { groupsRepository } from './repository.groups.list';
import { getRequestorUuidFromReq } from '../../../../core/helpers/get.requestor.uuid.from.req';

// Явно указываем тип для pool
const pool = pgPool as Pool;

// Логгер для основных операций
const lgr = {
    info: (message: string, meta?: object) => console.log(`[DeleteGroupsService] ${message}`, meta || ''),
    error: (message: string, error?: unknown) => console.error(`[DeleteGroupsService] ${message}`, error || '')
};

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
            
            // Логируем начало операции
            lgr.info('Starting delete operation', { 
                groupIds,
                requestorUuid
            });

            // Выполняем SQL-запрос для удаления групп
            const result = await pool.query(queries.deleteSelectedGroups, [groupIds]);

            // Проверяем результат
            if (!result.rows || !Array.isArray(result.rows)) {
                const errorMessage = 'Invalid database response format';
                lgr.error(errorMessage);
                throw new Error(errorMessage);
            }

            // Логируем успешное удаление
            const deletedCount = result.rows.length;
            lgr.info('Successfully deleted groups', { 
                deletedCount,
                requestorUuid
            });

            // Очищаем кэш в репозитории
            groupsRepository.clearCache();

            // Проверяем, что кэш действительно очищен
            const isCacheCleared = !groupsRepository.hasValidCache();
            if (isCacheCleared) {
                lgr.info('Cache successfully cleared', { requestorUuid });
            } else {
                lgr.error('Cache was not cleared successfully', { requestorUuid });
            }

            // Возвращаем количество удаленных групп
            return deletedCount;

        } catch (error) {
            // Логируем ошибку
            lgr.error('Error during groups deletion', error);

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