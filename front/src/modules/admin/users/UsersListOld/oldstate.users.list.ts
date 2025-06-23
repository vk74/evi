/**
 * @file state.users.list.ts
 * Version: 1.0.01
 * Frontend store for managing the state of the users list.
 *
 * Functionality:
 * - Manages the state of users, including loading, error, pagination, sorting, and selection.
 * - Implements caching for the users list to reduce server requests.
 * - Provides methods for updating, sorting, selecting, and clearing the cache.
 */

import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/core/state/userstate';
import type {
    IUser,
    ItemsPerPageOption,
    ISortParams,
    ISearchParams,
    IFetchUsersParams,
    CacheEntry,
    IPaginationParams,
    CacheStats
} from './oldtypes.users.list';

// Logger for main operations
const logger = {
    info: (message: string, meta?: object) => console.log(`[UsersStore] ${message}`, meta || ''),
    error: (message: string, meta?: object) => console.error(`[UsersStore] ${message}`, meta || '')
};

// Define the Pinia store for users list
export const useStoreUsersList = defineStore('usersList', () => {
    // State definitions
    // Store the complete list of users without applying pagination here
    const users = ref<IUser[]>([]); // List of all users (full dataset)
    const loading = ref(false); // Loading state
    const error = ref<string | null>(null); // Error state
    const page = ref(1); // Current page number
    const itemsPerPage = ref<ItemsPerPageOption>(25); // Number of items per page
    const totalNumberOfUsers = ref(0); // Total number of items (updated from API response)
    const sorting = ref<ISortParams>({ // Sorting parameters
        sortBy: 'username',
        sortDesc: false
    });
    const selectedUsers = ref<string[]>([]); // List of selected user IDs
    const search = ref<string>(''); // Search query (handled by v-data-table)

    // Get the authenticated user store
    const userStore = useUserStore();

    // Watch for token changes and refresh data if needed
    watch(() => userStore.jwt, (newToken) => {
        if (newToken) {
            // New token available, refresh data
            logger.info('Token refreshed, clearing cache');
            clearCache();
        }
    });

    // Computed properties
    /**
     * Returns the complete list of users with applied sorting only.
     * Note: Pagination and search filtering are handled by v-data-table component.
     * @returns {IUser[]} - Sorted list of all users (no pagination applied).
     */
    const getUsers = computed(() => {
        logger.info('getUsers called', {
            totalItems: totalNumberOfUsers.value,
            usersCount: users.value.length
        });

        const result = [...users.value];

        if (sorting.value.sortBy) {
            result.sort((a, b) => {
                const aValue = a[sorting.value.sortBy as keyof IUser];
                const bValue = b[sorting.value.sortBy as keyof IUser];
                const modifier = sorting.value.sortDesc ? -1 : 1;

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    // Special handling for date fields
                    if (sorting.value.sortBy === 'created_at' || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(aValue)) {
                        const dateA = new Date(aValue);
                        const dateB = new Date(bValue);
                        return (dateA.getTime() - dateB.getTime()) * modifier;
                    }
                    return aValue.localeCompare(bValue) * modifier;
                }

                if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    return (aValue === bValue) ? 0 : (aValue ? modifier : -modifier);
                }

                return ((aValue as any) > (bValue as any)) ? modifier : -modifier;
            });
        }

        return result; // Return full sorted list for v-data-table to handle pagination locally
    });

    // Get the count of selected users
    const selectedCount = computed(() => selectedUsers.value.length);

    // Check if any users are selected
    const hasSelected = computed(() => selectedUsers.value.length > 0);

    // Check if exactly one user is selected
    const hasOneSelected = computed(() => selectedUsers.value.length === 1);

    // Get the first selected user ID (useful for edit operations)
    const firstSelectedUserId = computed(() => {
        return selectedUsers.value.length > 0 ? selectedUsers.value[0] : null;
    });

    // Calculate total filtered users count (for display in UI)
    const totalFilteredUsers = computed(() => {
        return totalNumberOfUsers.value;
    });

    // Actions
    /**
     * Updates the cache with new users data.
     * @param newUsers - New list of users.
     * @param total - Total number of users.
     */
    function setUsers(data: IUser[], total?: number) {
        users.value = [...data]; // Replace the array with new data
        totalNumberOfUsers.value = total !== undefined ? total : data.length;
        // Reset selection when data changes
        selectedUsers.value = [];
        logger.info('Cache updated with new users data', {
            userCount: data.length,
            totalNumberOfUsers: totalNumberOfUsers.value
        });
    }

    /**
     * Updates the loading state.
     * @param isLoading - New loading state.
     */
    function setLoading(isLoading: boolean) {
        loading.value = isLoading;
    }

    /**
     * Sets the error state.
     * @param errorMessage - Error message or null to clear errors.
     */
    function setError(errorMessage: string | null) {
        error.value = errorMessage;
    }

    /**
     * Updates the pagination parameters.
     * @param newPage - New page number.
     * @param newItemsPerPage - New items per page count.
     */
    function setPagination(newPage: number, newItemsPerPage: ItemsPerPageOption) {
        page.value = newPage;
        itemsPerPage.value = newItemsPerPage;
        logger.info('Display parameters updated', {
            page: newPage,
            itemsPerPage: newItemsPerPage
        });
    }

    /**
     * Updates the sorting parameters.
     * @param newSortBy - Field to sort by.
     * @param newSortDesc - Sort direction (true for descending).
     */
    function setSorting(newSortBy: string, newSortDesc: boolean) {
        sorting.value = {
            sortBy: newSortBy,
            sortDesc: newSortDesc
        };
        logger.info('Sorting parameters updated', {
            sortBy: newSortBy,
            sortDesc: newSortDesc
        });
    }

    /**
     * Updates the search query.
     * @param query - Search query string.
     */
    function setSearch(query: string) {
        search.value = query;
        // Reset to first page when search changes
        page.value = 1;
        logger.info('Search query updated', { query });
    }

    /**
     * Toggles selection of a single user.
     * @param userId - ID of the user to toggle selection.
     */
    function toggleUserSelection(userId: string) {
        const index = selectedUsers.value.indexOf(userId);
        if (index === -1) {
            selectedUsers.value.push(userId);
            logger.info('User selected', { userId });
        } else {
            selectedUsers.value.splice(index, 1);
            logger.info('User deselected', { userId });
        }
    }

    /**
     * Selects or deselects all users on the current page.
     * @param currentPageUserIds - IDs of users on the current page.
     */
    function toggleSelectAll(currentPageUserIds: string[]) {
        // If all users on the current page are already selected, deselect them
        if (currentPageUserIds.every(id => selectedUsers.value.includes(id))) {
            selectedUsers.value = selectedUsers.value.filter(id => !currentPageUserIds.includes(id));
            logger.info('All users on current page deselected');
        } else {
            // Otherwise, add all users from the current page that aren't already selected
            const newSelectedIds = currentPageUserIds.filter(id => !selectedUsers.value.includes(id));
            selectedUsers.value = [...selectedUsers.value, ...newSelectedIds];
            logger.info('All users on current page selected');
        }
    }

    /**
     * Checks if a specific user is selected.
     * @param userId - ID of the user to check.
     * @returns boolean - True if the user is selected.
     */
    function isUserSelected(userId: string) {
        return selectedUsers.value.includes(userId);
    }

    /**
     * Removes users from the list (after deletion).
     * @param userIds - IDs of users to remove.
     */
    function removeUsers(userIds: string[]) {
        users.value = users.value.filter(user => !userIds.includes(user.user_id));
        // Remove deleted users from selection
        selectedUsers.value = selectedUsers.value.filter(id => !userIds.includes(id));
        // Update total count
        totalNumberOfUsers.value -= userIds.length;
        logger.info('Users removed from cache', { removedCount: userIds.length });
    }

    /**
     * Clears all selections.
     */
    function clearSelection() {
        selectedUsers.value = [];
        logger.info('Selection cleared');
    }

    /**
     * Clears the cache when needed.
     */
    function clearCache() {
        users.value = [];
        totalNumberOfUsers.value = 0;
        selectedUsers.value = [];
        error.value = null;
        logger.info('Cache cleared');
    }

    // Expose the state and methods
    return {
        // State
        users,
        loading,
        error,
        page,
        itemsPerPage,
        totalNumberOfUsers,
        sorting,
        selectedUsers,
        search,

        // Computed
        getUsers,
        totalFilteredUsers,
        selectedCount,
        hasSelected,
        hasOneSelected,
        firstSelectedUserId,

        // Methods
        setUsers,
        setLoading,
        setError,
        setPagination,
        setSorting,
        setSearch,
        toggleUserSelection,
        toggleSelectAll,
        isUserSelected,
        removeUsers,
        clearSelection,
        clearCache
    };
});
