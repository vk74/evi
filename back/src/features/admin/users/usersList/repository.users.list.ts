/**
 * @file repository.users.list.ts
 * Repository for caching users list data.
 * 
 * Functionality:
 * - Maintains in-memory cache for users list
 * - Implements cache invalidation with timer
 * - Provides methods to check, get and set cache
 * 
 * Cache algorithm:
 * 1. Cache starts empty on service initialization
 * 2. First request triggers database query and caches result
 * 3. Cache is valid for 60 minutes from last update
 * 4. Timer resets on each new cache update
 * 5. After timer expires, cache is cleared and next request will query database
 */

import { IUsersResponse } from './types.users.list';

// Создаем замыкание для хранения состояния кэша и таймера
const createUsersRepository = () => {
    let cache: IUsersResponse | null = null;
    let cacheTimer: NodeJS.Timeout | null = null;
    console.log('Repository initialized with empty cache');

    return {
        // Проверка наличия данных в кэше
        hasValidCache: (): boolean => {
            return cache !== null;
        },

        // Получение данных из кэша
        getCachedData: (): IUsersResponse => {
            if (!cache) {
                throw new Error('Cache is empty');
            }
            return cache;
        },

        // Сохранение данных в кэш и запуск таймера
        setCacheData: (data: IUsersResponse): void => {
            console.log('Writing data to cache');
            cache = data;

            // Очищаем предыдущий таймер если он есть
            if (cacheTimer) {
                clearTimeout(cacheTimer);
            }

            // Устанавливаем новый таймер на 60 минут
            cacheTimer = setTimeout(() => {
                console.log('Timer expired, clearing cache with users list');
                cache = null;
                cacheTimer = null;
            }, 60 * 60 * 1000); // 60 минут в миллисекундах
            console.log('Timer started for 60 minutes for users list cache');
        },

        clearCache: (): void => {
            console.log('Clearing users list cache');
            cache = null;
            if (cacheTimer) {
              clearTimeout(cacheTimer);
              cacheTimer = null;
            }
          }
    };
};

export const usersRepository = createUsersRepository();