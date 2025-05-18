/**
 * @file state.users.list.ts
 * Version: 1.0.0
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
    ItemsPerPageOption
} from './types.users.list';

// Define the Pinia store for users list
export const useStoreUsersList = defineStore('usersList', () => {
    // State definitions
    // Store the complete list of users without applying pagination here
    const users = ref<IUser[]>([]); // List of all users (full dataset)
    const loading = ref(false); // Loading state
    const error = ref<string | null>(null); // Error state
    const page = ref(1); // Current page number
    const itemsPerPage = ref<ItemsPerPageOption>(25); // Number of items per page
    const totalNumberOfUsers = ref(0); // Total number of items
    const sortBy = ref<string>('username'); // Column to sort by
    const sortDesc = ref<boolean>(false); // Sort direction
    const selectedUsers = ref<string[]>([]); // List of selected user IDs
    const search = ref<string>(''); // Search query

    // Get the authenticated user store
    const userStore = useUserStore();

    // Watch for token changes and refresh data if needed
    watch(() => userStore.jwt, (newToken) => {
        if (newToken) {
            // New token available, refresh data
            console.log('[UsersStore] Token refreshed, clearing cache');
            clearCache();
        }
    });

    // Computed properties
    // Get the current page of users based on sorting and pagination
    const getUsers = computed(() => {
        // If no data, return empty array
        if (users.value.length === 0) {
            return [];
        }

        // Create a copy of the users array to avoid mutating the original
        let filteredUsers = [...users.value];

        // Apply search filter if provided
        if (search.value && search.value.trim() !== '') {
            const searchTerm = search.value.toLowerCase();
            filteredUsers = filteredUsers.filter(user => {
                return (
                    user.user_id.toLowerCase().includes(searchTerm) ||
                    user.username.toLowerCase().includes(searchTerm) ||
                    user.email.toLowerCase().includes(searchTerm) ||
                    user.first_name.toLowerCase().includes(searchTerm) ||
                    (user.middle_name && user.middle_name.toLowerCase().includes(searchTerm)) ||
                    user.last_name.toLowerCase().includes(searchTerm)
                );
            });
        }

        // Apply sorting
        if (sortBy.value) {
            filteredUsers.sort((a, b) => {
                const aValue = a[sortBy.value as keyof IUser];
                const bValue = b[sortBy.value as keyof IUser];

                if (aValue === bValue) return 0;
                if (aValue === null) return sortDesc.value ? 1 : -1;
                if (bValue === null) return sortDesc.value ? -1 : 1;

                let result = 0;
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    // Check if the strings represent ISO date format (for created_at field)
                    if (sortBy.value === 'created_at' || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(aValue)) {
                        // Compare dates when the field is a date string
                        const dateA = new Date(aValue);
                        const dateB = new Date(bValue);
                        result = dateA.getTime() - dateB.getTime();
                    } else {
                        // Regular string comparison
                        result = aValue.localeCompare(bValue);
                    }
                } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    result = aValue === bValue ? 0 : aValue ? 1 : -1;
                } else {
                    // Default comparison for other types
                    result = String(aValue).localeCompare(String(bValue));
                }

                return sortDesc.value ? -result : result;
            });
        }

        // Update total after filtering
        totalNumberOfUsers.value = filteredUsers.length;

        // Apply pagination
        const start = (page.value - 1) * itemsPerPage.value;
        const end = start + itemsPerPage.value;
        return filteredUsers.slice(start, end);
    });

    // Get the total number of filtered users
    const totalFilteredUsers = computed(() => {
        return totalNumberOfUsers.value;
    });

    // Get the count of selected users
    const selectedCount = computed(() => selectedUsers.value.length);

    // Check if at least one user is selected
    const hasSelected = computed(() => selectedUsers.value.length > 0);

    // Check if exactly one user is selected
    const hasOneSelected = computed(() => selectedUsers.value.length === 1);

    // Get the first selected user ID (useful for edit operations)
    const firstSelectedUserId = computed(() => {
        return selectedUsers.value.length > 0 ? selectedUsers.value[0] : null;
    });

    // Action methods
    // Set the users data
    function setUsers(data: IUser[]) {
        users.value = data;
        totalNumberOfUsers.value = data.length;
        // Reset selection when data changes
        selectedUsers.value = [];
    }

    // Update loading state
    function setLoading(isLoading: boolean) {
        loading.value = isLoading;
    }

    // Set error state
    function setError(errorMessage: string | null) {
        error.value = errorMessage;
    }

    // Update pagination settings
    function setPagination(newPage: number, newItemsPerPage: ItemsPerPageOption) {
        page.value = newPage;
        itemsPerPage.value = newItemsPerPage;
    }

    // Update sorting settings
    function setSorting(newSortBy: string, newSortDesc: boolean) {
        sortBy.value = newSortBy;
        sortDesc.value = newSortDesc;
    }

    // Update search query
    function setSearch(query: string) {
        search.value = query;
        // Reset to first page when search changes
        page.value = 1;
    }

    // Toggle selection of a single user
    function toggleUserSelection(userId: string) {
        const index = selectedUsers.value.indexOf(userId);
        if (index === -1) {
            selectedUsers.value.push(userId);
        } else {
            selectedUsers.value.splice(index, 1);
        }
    }

    // Select or deselect all users on the current page
    function toggleSelectAll(currentPageUserIds: string[]) {
        // If all users on the current page are already selected, deselect them
        if (currentPageUserIds.every(id => selectedUsers.value.includes(id))) {
            selectedUsers.value = selectedUsers.value.filter(id => !currentPageUserIds.includes(id));
        } else {
            // Otherwise, add all users from the current page that aren't already selected
            const newSelectedIds = currentPageUserIds.filter(id => !selectedUsers.value.includes(id));
            selectedUsers.value = [...selectedUsers.value, ...newSelectedIds];
        }
    }

    // Check if a specific user is selected
    function isUserSelected(userId: string) {
        return selectedUsers.value.includes(userId);
    }

    // Remove users from the list (after deletion)
    function removeUsers(userIds: string[]) {
        users.value = users.value.filter(user => !userIds.includes(user.user_id));
        // Remove deleted users from selection
        selectedUsers.value = selectedUsers.value.filter(id => !userIds.includes(id));
        // Update total count
        totalNumberOfUsers.value = users.value.length;
    }

    // Clear all selections
    function clearSelection() {
        selectedUsers.value = [];
    }

    // Clear the cache when needed
    function clearCache() {
        users.value = [];
        totalNumberOfUsers.value = 0;
        selectedUsers.value = [];
        error.value = null;
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
        sortBy,
        sortDesc,
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
