/**
 * @file repository.groups.list.ts
 * Repository for caching groups list data.
 *
 * Functionality:
 * - Maintains in-memory cache for groups list
 * - Implements cache invalidation with timer
 * - Provides methods to check, get, and set cache
 *
 * Cache algorithm:
 * 1. Cache starts empty on service initialization
 * 2. First request triggers database query and caches result
 * 3. Cache is valid for 60 minutes from last update
 * 4. Timer resets on each new cache update
 * 5. After timer expires, cache is cleared and next request will query database
 */

import { IGroupsResponse } from './types.groups.list';

// Создаем замыкание для хранения состояния кэша и таймера
const createGroupsRepository = () => {
    let cache: IGroupsResponse | null = null;
    let cacheTimer: NodeJS.Timeout | null = null;
    console.log('Repository initialized with empty cache');

    return {
        // Проверка наличия данных в кэше
        hasValidCache: (): boolean => {
            return cache !== null;
        },

        // Получение данных из кэша
        getCachedData: (): IGroupsResponse => {
            if (!cache) {
                throw new Error('Cache is empty');
            }
            return cache;
        },

        // Сохранение данных в кэш и запуск таймера
        setCacheData: (data: IGroupsResponse): void => {
            console.log('Writing data to groups list cache');
            cache = data;

            // Очищаем предыдущий таймер если он есть
            if (cacheTimer) {
                clearTimeout(cacheTimer);
            }

            // Устанавливаем новый таймер на 60 минут
            cacheTimer = setTimeout(() => {
                console.log('Timer expired, clearing cache with groups list');
                cache = null;
                cacheTimer = null;
            }, 60 * 60 * 1000); // 60 минут в миллисекундах
            console.log('Timer started for 60 minutes for groups list cache');
        },

        // Очистка кэша
        clearCache: (): void => {
            console.log('Clearing groups list cache');
            cache = null;
            if (cacheTimer) {
                clearTimeout(cacheTimer);
                cacheTimer = null;
            }
        }
    };
};

export const groupsRepository = createGroupsRepository();