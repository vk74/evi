import { defineStore } from 'pinia';
import { ref, computed, onUnmounted } from 'vue';
import { useUserStore } from '@/core/state/userstate';
import type {
    IGroup,
    ItemsPerPageOption,
    ISortParams,
    GroupStatus
} from './types.groups.list';

// Logger для основных операций
const logger = {
    info: (message: string) => console.log(`[GroupsStore] ${message}`),
    error: (message: string) => console.error(`[GroupsStore] ${message}`)
};

export const useStoreGroupsList = defineStore('groupsList', () => {
    // State
    const groups = ref<IGroup[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const page = ref(1);
    const itemsPerPage = ref<ItemsPerPageOption>(25);
    const totalItems = ref(0);
    const sorting = ref<ISortParams>({
        sortBy: '',
        sortDesc: false
    });
    const selectedGroups = ref<string[]>([]);

    // Таймер для проверки JWT
    const jwtCheckTimer = ref<ReturnType<typeof setTimeout> | null>(null);

    // Getters
    const getGroups = computed(() => {
        logger.info('Getting groups with current display parameters');
        const start = (page.value - 1) * itemsPerPage.value;
        const end = start + itemsPerPage.value;

        const result = [...groups.value];

        if (sorting.value.sortBy) {
            result.sort((a, b) => {
                const aValue = a[sorting.value.sortBy as keyof IGroup];
                const bValue = b[sorting.value.sortBy as keyof IGroup];
                const modifier = sorting.value.sortDesc ? -1 : 1;

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return aValue.localeCompare(bValue) * modifier;
                }

                if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    return (aValue === bValue) ? 0 : (aValue ? modifier : -modifier);
                }

                return aValue > bValue ? modifier : -modifier;
            });
        }

        return result.slice(start, end);
    });

    const selectedCount = computed(() => selectedGroups.value.length);
    const hasSelected = computed(() => selectedCount.value > 0);

    // Actions
    /**
     * Валидирует JWT токен и возвращает его статус
     */
    function validateJWT(): { isValid: boolean; expiresIn: number } {
        const userStore = useUserStore();
        const tokenExpiresTime = userStore.tokenExpires ? Number(userStore.tokenExpires) : 0;

        return {
            isValid: Boolean(userStore.isLoggedIn && tokenExpiresTime > Date.now() / 1000),
            expiresIn: tokenExpiresTime ? tokenExpiresTime - Date.now() / 1000 : 0
        };
    }

    /**
     * Устанавливает таймер для проверки JWT
     */
    function setupJWTCheck() {
        if (jwtCheckTimer.value) {
            clearTimeout(jwtCheckTimer.value);
            jwtCheckTimer.value = null;
        }

        const { isValid, expiresIn } = validateJWT();

        if (!isValid) {
            clearCache();
            return;
        }

        // Устанавливаем таймер на (срок валидности - 4 секунды)
        const timeoutDuration = (expiresIn - 4) * 1000;

        jwtCheckTimer.value = setTimeout(() => {
            const validation = validateJWT();

            if (validation.expiresIn <= 4) {
                clearSelection();
                clearCache();
            } else {
                setupJWTCheck(); // Перезапускаем таймер
            }
        }, timeoutDuration);

        logger.info(`JWT check timer set for ${timeoutDuration}ms`);
    }

    /**
     * Обновляет кэш с новыми данными о группах
     */
    function updateCache(newGroups: IGroup[], total: number) {
        groups.value = newGroups;
        totalItems.value = total;
        setupJWTCheck(); // Запускаем таймер после обновления кэша
        logger.info(`Cache updated with ${newGroups.length} groups`);
    }

    /**
     * Обновляет параметры отображения (пагинация)
     */
    function updateDisplayParams(newItemsPerPage: ItemsPerPageOption, newPage: number) {
        itemsPerPage.value = newItemsPerPage;
        page.value = newPage;
        logger.info(`Display params updated: ${newItemsPerPage} items per page, page ${newPage}`);
    }

    /**
     * Обновляет параметры сортировки
     */
    function updateSort(field: keyof IGroup) {
        if (sorting.value.sortBy === field) {
            sorting.value.sortDesc = !sorting.value.sortDesc;
        } else {
            sorting.value = {
                sortBy: field,
                sortDesc: false
            };
        }
        logger.info(`Sorting updated: ${field} ${sorting.value.sortDesc ? 'DESC' : 'ASC'}`);
    }

    /**
     * Выбирает группу
     */
    function selectGroup(groupId: string) {
        if (!selectedGroups.value.includes(groupId)) {
            selectedGroups.value.push(groupId);
            logger.info(`Group ${groupId} selected`);
        }
    }

    /**
     * Снимает выбор с группы
     */
    function deselectGroup(groupId: string) {
        selectedGroups.value = selectedGroups.value.filter(id => id !== groupId);
        logger.info(`Group ${groupId} deselected`);
    }

    /**
     * Очищает выбор групп
     */
    function clearSelection() {
        selectedGroups.value = [];
        logger.info('Selection cleared');
    }

    /**
     * Очищает кэш и сбрасывает состояние хранилища
     */
    function clearCache() {
        groups.value = [];
        totalItems.value = 0;
        error.value = null;
        clearSelection();
        if (jwtCheckTimer.value) {
            clearTimeout(jwtCheckTimer.value);
            jwtCheckTimer.value = null;
        }
        logger.info('Cache cleared');
    }

    // Очистка таймера при уничтожении компонента
    onUnmounted(() => {
        if (jwtCheckTimer.value) {
            clearTimeout(jwtCheckTimer.value);
        }
    });

    return {
        // State
        groups,
        loading,
        error,
        page,
        itemsPerPage,
        totalItems,
        sorting,
        selectedGroups,

        // Getters
        getGroups,
        selectedCount,
        hasSelected,

        // Actions
        updateCache,
        updateDisplayParams,
        updateSort,
        selectGroup,
        deselectGroup,
        clearSelection,
        clearCache
    };
});