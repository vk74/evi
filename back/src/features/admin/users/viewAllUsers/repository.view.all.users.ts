import { IUsersResponse } from './types.view.all.users';

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
                console.log('Timer expired, clearing cache');
                cache = null;
                cacheTimer = null;
            }, 60 * 60 * 1000); // 60 минут в миллисекундах

            console.log('Cache timer started for 60 minutes');
        }
    };
};

export const usersRepository = createUsersRepository();