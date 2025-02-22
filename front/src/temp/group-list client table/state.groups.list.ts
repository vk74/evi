/**
 * @file state.groups.list.ts
 * Frontend store for managing the state of the groups list.
 *
 * Functionality:
 * - Manages the state of groups, including loading, error, pagination, sorting, and selection.
 * - Implements caching for the groups list to reduce database load.
 * - Handles JWT token validation and automatic cache clearing when the token expires.
 * - Provides methods for updating, sorting, selecting, and clearing the cache.
 */

import { defineStore } from 'pinia';
import { ref, computed, onUnmounted } from 'vue';
import { useUserStore } from '@/core/state/userstate';
import type {
    IGroup,
    ItemsPerPageOption,
    ISortParams
} from './types.groups.list';

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[GroupsStore] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[GroupsStore] ${message}`, meta || '')
};

export const useStoreGroupsList = defineStore('groupsList', () => {
    // State
    const groups = ref<IGroup[]>([]); // List of groups
    const loading = ref(false); // Loading state
    const error = ref<string | null>(null); // Error state
    const page = ref(1); // Current page number
    const itemsPerPage = ref<ItemsPerPageOption>(25); // Number of items per page
    const totalNumberOfGroups = ref(0); // Total number of items
    const sorting = ref<ISortParams>({ // Sorting parameters
        sortBy: '',
        sortDesc: false
    });
    const selectedGroups = ref<string[]>([]); // List of selected group IDs

    // Timer for JWT validation
    const groupsJwtCheckTimer = ref<ReturnType<typeof setTimeout> | null>(null);

    // Getters
    /**
     * Returns the list of groups with applied pagination and sorting.
     * @returns {IGroup[]} - Sorted and paginated list of groups.
     */
    const getGroups = computed(() => {
        logger.info('[Store] getGroups called', {
          page: page.value,
          itemsPerPage: itemsPerPage.value,
          totalItems: totalNumberOfGroups.value,
          groupsCount: groups.value.length
        });
      
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

    const selectedCount = computed(() => selectedGroups.value.length); // Number of selected groups
    const hasSelected = computed(() => selectedCount.value > 0); // Whether any groups are selected

    // Actions
    /**
     * Validates the JWT token and returns its status.
     * @returns { isValid: boolean; expiresIn: number } - Token validation status.
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
     * Sets up a timer to check JWT validity and clear the cache if the token expires.
     */
    function setupJWTCheck() {
        if (groupsJwtCheckTimer.value) {
            clearTimeout(groupsJwtCheckTimer.value);
            groupsJwtCheckTimer.value = null;
        }

        const { isValid, expiresIn } = validateJWT();

        if (!isValid) {
            clearCache();
            return;
        }

        // Set a timer for (token expiration time - 4 seconds)
        const timeoutDuration = (expiresIn - 4) * 1000;

        groupsJwtCheckTimer.value = setTimeout(() => {
            const validation = validateJWT();

            if (validation.expiresIn <= 4) {
                clearSelection();
                clearCache();
            } else {
                setupJWTCheck(); // Restart the timer
            }
        }, timeoutDuration);

        logger.info(`JWT check timer set for ${timeoutDuration}ms`);
    }

    /**
     * Updates the cache with new groups data.
     * @param newGroups - New list of groups.
     * @param total - Total number of groups.
     */
    function updateCache(newGroups: IGroup[], total: number) {
        groups.value = [...newGroups]; // Замена массива
        totalNumberOfGroups.value = total;
        setupJWTCheck(); // Start the timer after updating the cache
        logger.info('Cache updated with new groups data', {
            groupCount: newGroups.length,
            totalNumberOfGroups: total
        });
    }

    /**
     * Updates the display parameters (pagination).
     * @param newItemsPerPage - New number of items per page.
     * @param newPage - New page number.
     */
    function updateDisplayParams(newItemsPerPage: ItemsPerPageOption, newPage: number) {
        itemsPerPage.value = newItemsPerPage;
        page.value = newPage;
        logger.info('Display parameters updated', {
            itemsPerPage: newItemsPerPage,
            page: newPage
        });
    }

    /**
     * Updates the sorting parameters.
     * @param field - Field to sort by.
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
        logger.info('Sorting parameters updated', {
            sortBy: sorting.value.sortBy,
            sortDesc: sorting.value.sortDesc
        });
    }

    /**
     * Selects a group.
     * @param groupId - ID of the group to select.
     */
    function selectGroup(groupId: string) {
        if (!selectedGroups.value.includes(groupId)) {
            selectedGroups.value.push(groupId);
            logger.info('Group selected', { groupId });
        }
    }

    /**
     * Deselects a group.
     * @param groupId - ID of the group to deselect.
     */
    function deselectGroup(groupId: string) {
        selectedGroups.value = selectedGroups.value.filter(id => id !== groupId);
        logger.info('Group deselected', { groupId });
    }

    /**
     * Clears the selection of groups.
     */
    function clearSelection() {
        selectedGroups.value = [];
        logger.info('Group selection cleared');
    }

    /**
     * Clears the cache and resets the store state.
     */
    function clearCache() {
        groups.value = [];
        totalNumberOfGroups.value = 0;
        error.value = null;
        clearSelection();
        if (groupsJwtCheckTimer.value) {
            clearTimeout(groupsJwtCheckTimer.value);
            groupsJwtCheckTimer.value = null;
        }
        logger.info('Cache cleared');
    }

    // Подписка на изменения isLoggedIn
    /**
    const userStore = useUserStore()
    watch(
        () => userStore.isLoggedIn,
        (newValue, oldValue) => {
            if (!newValue) {
                logger.info('User logged out, clearing cache')
                clearCache()
            }
        }
    )
    */

    // Clean up the timer when the component is destroyed
    onUnmounted(() => {
        if (groupsJwtCheckTimer.value) {
            clearTimeout(groupsJwtCheckTimer.value);
        }
    });

    return {
        // State
        groups,
        loading,
        error,
        page,
        itemsPerPage,
        totalNumberOfGroups,
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