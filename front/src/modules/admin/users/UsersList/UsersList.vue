/**
 * @file UsersList.vue
 * Version: 1.0.07
 * Component for displaying and managing the system users list with server-side processing.
 *
 * Functionality:
 * - Display users in table format with server-side pagination
 * - Search by UUID, username, email, first_name, last_name fields (server-side)
 * - Sort by columns with server-side processing
 * - Edit users through UserEditor
 * - Reset user passwords through ChangePassword
 * - Optimized data caching (server-side)
 * - Sidebar for control elements placement (dynamic separation into general and item-specific)
 * - Custom paginator with full server-side pagination support (replaces built-in v-data-table paginator)
 * - Improved paginator interface with proper element positioning and right alignment
 * - Full interface localization with i18n support
 */
<script setup lang="ts">
import usersFetchService from './Service.fetch.users'
import deleteSelectedUsersService from './Service.delete.selected.users'
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStoreUsersList } from './State.users.list'
import type { 
  TableHeader, 
  ItemsPerPageOption, 
  IFetchUsersParams,
  // ISortParams // No longer directly used here, managed by local refs
} from './Types.users.list'
import { useUsersAdminStore } from '../state.users.admin'
import loadUserService from '../UserEditor/service.load.user'
import { useUserEditorStore } from '../UserEditor/state.user.editor'
import { useUiStore } from '@/core/state/uistate'
import { useUserStore } from '@/core/state/userstate'
import debounce from 'lodash/debounce'
import ChangePassword from '../../../../core/ui/modals/change-password/ChangePassword.vue'
import { PasswordChangeMode } from '../../../../core/ui/modals/change-password/types.change.password'

// Initialize stores and i18n
const { t } = useI18n()
const usersStore = useStoreUsersList()
const usersSectionStore = useUsersAdminStore()
const uiStore = useUiStore()
const userStore = useUserStore()

// Table and search parameters
const page = ref<number>(usersStore.page);
const itemsPerPage = ref<ItemsPerPageOption>(usersStore.itemsPerPage as ItemsPerPageOption);
const searchQuery = ref<string>(usersStore.search || ''); // Initialize with store's search
const isSearching = ref<boolean>(false);

// Sort tracking
const sortBy = ref<string | null>(usersStore.sortBy || null);
const sortDesc = ref<boolean>(usersStore.sortDesc);

// Dialog state
const showDeleteDialog = ref(false)
const showPasswordDialog = ref(false)

// Selected user data for password reset
const selectedUserData = ref({
  uuid: '',
  username: ''
})

// Computed properties
const isAuthorized = computed(() => userStore.isLoggedIn)
const selectedCount = computed(() => usersStore.selectedCount)
const hasSelected = computed(() => usersStore.hasSelected)
const hasOneSelected = computed(() => usersStore.hasOneSelected)
const loading = computed(() => usersStore.loading)
const users = computed(() => usersStore.currentUsers)
const totalItems = computed(() => usersStore.totalItems)
const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// User action handlers
const createUser = () => {
  console.log('[ViewAllUsers] Starting create user operation')
  
  try {
    // Get UserEditor store
    const userEditorStore = useUserEditorStore()
    
    // Reset form to initial values
    userEditorStore.resetForm()
    
    // Set creation mode
    userEditorStore.mode = {
      mode: 'create'
    }
    
    // Switch to user editor section
    usersSectionStore.setActiveSection('user-editor')
    
  } catch (error) {
    console.error('[ViewAllUsers] Error initializing create mode:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Error initializing creation mode'
    )
  }
}

const onSelectUser = (userId: string, selected: boolean) => {
  if (selected) {
    usersStore.selectUser(userId)
  } else {
    usersStore.deselectUser(userId)
  }
}

const isSelected = (userId: string) => {
  return usersStore.isSelected(userId)
}

const onDeleteSelected = () => {
  showDeleteDialog.value = true
}

const cancelDelete = () => {
  showDeleteDialog.value = false
}

const confirmDelete = async () => {
  console.log('[ViewAllUsers] Starting confirmDelete operation')
  
  try {
    console.log('[ViewAllUsers] Calling delete service with selectedUsers:', usersStore.selectedUsers)
    const deletedCount = await deleteSelectedUsersService.deleteSelectedUsers(usersStore.selectedUsers)
    console.log('[ViewAllUsers] Service returned deletedCount:', deletedCount)
    
    console.log('[ViewAllUsers] Preparing success message')
    const message = t('list.messages.deleteUsersSuccess', { count: deletedCount })
    console.log('[ViewAllUsers] Success message prepared:', message)
    
    console.log('[ViewAllUsers] Showing success notification')
    uiStore.showSuccessSnackbar(message)
    
    // Update users list after deletion
    // Fetch with current parameters to maintain view
    await usersFetchService.fetchUsers({
        page: page.value,
        itemsPerPage: itemsPerPage.value,
        sortBy: sortBy.value || '',
        sortDesc: sortDesc.value,
        search: searchQuery.value
    })
    
  } catch (error) {
    console.error('[ViewAllUsers] Error during users deletion:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Error deleting users'
    )
  } finally {
    console.log('[ViewAllUsers] Closing delete dialog')
    showDeleteDialog.value = false
    usersStore.clearSelection()
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'teal';
    case 'disabled': return 'error';
    case 'archived': return 'grey';
    case 'requires_user_action': return 'orange';
    default: return 'black';
  }
};

// Function to get ID of the single selected user
const getSelectedUserId = (): string => {
  console.log('[ViewAllUsers] Getting selected user ID')
  return usersStore.selectedUsers[0]
}

// Function to handle password reset button click
const resetPassword = async () => {
  console.log('[ViewAllUsers] Starting reset password operation')
  
  try {
    const userId = getSelectedUserId()
    console.log('[ViewAllUsers] Selected user ID for password reset:', userId)
    
    // Find selected user in current list
    const selectedUser = users.value.find(user => user.user_id === userId)
    
    if (selectedUser) {
      // Save selected user data
      selectedUserData.value = {
        uuid: selectedUser.user_id,
        username: selectedUser.username
      }
      
      // Open password reset dialog
      showPasswordDialog.value = true
    } else {
      console.error('[ViewAllUsers] Selected user not found in current list')
      uiStore.showErrorSnackbar('User not found in current list')
    }
  } catch (error) {
    console.error('[ViewAllUsers] Error preparing password reset:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Error preparing password reset'
    )
  }
}

// Function to handle edit button click
const editUser = async () => {
  console.log('[ViewAllUsers] Starting edit user operation')
  
  try {
    const userId = getSelectedUserId()
    console.log('[ViewAllUsers] Selected user ID:', userId)
    
    // Load user data
    await loadUserService.fetchUserById(userId)
    console.log('[ViewAllUsers] User data loaded successfully')
    
    // Switch to editing
    usersSectionStore.setActiveSection('user-editor')
    
  } catch (error) {
    console.error('[ViewAllUsers] Error loading user data:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Error loading user data'
    )
  }
}

// Function to force refresh the list
const refreshList = async () => {
  console.log('[ViewAllUsers] Forcing refresh of users list')
  try {
    // Invalidate cache for current params and refetch
    usersStore.invalidateCache({
        page: page.value,
        itemsPerPage: itemsPerPage.value,
        sortBy: sortBy.value || '',
        sortDesc: sortDesc.value,
        search: searchQuery.value
    });
    await usersFetchService.fetchUsers({
        page: page.value,
        itemsPerPage: itemsPerPage.value,
        sortBy: sortBy.value || '',
        sortDesc: sortDesc.value,
        search: searchQuery.value
    })
    uiStore.showSuccessSnackbar(t('list.messages.refreshSuccess'))
  } catch (error) {
    console.error('[ViewAllUsers] Error refreshing users list:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Error refreshing users list'
    )
  }
}

// Function to clear selected elements
const clearSelections = () => {
  console.log('[ViewAllUsers] Clearing all selections')
  usersStore.clearSelection()
  uiStore.showSuccessSnackbar(t('list.messages.clearSelectionsSuccess'))
}

// Define a more specific type for sortByInfo from v-data-table options
type VDataTableSortByItem = { key: string; order: 'asc' | 'desc' };

// New handler for @update:options with proper server-side pagination handling
const updateOptionsAndFetch = async (options: { page?: number, itemsPerPage?: number, sortBy?: Readonly<VDataTableSortByItem[]> }) => {
  console.log('[ViewAllUsers] @update:options triggered with:', JSON.parse(JSON.stringify(options)));
  console.log('[ViewAllUsers] Current state before update:', {
    page: page.value,
    itemsPerPage: itemsPerPage.value,
    totalItems: totalItems.value,
    usersCount: users.value.length
  });

  let needsFetch = false;
  let pageChanged = false;
  let itemsPerPageChanged = false;
  let sortChanged = false;

  // Handle page changes
  if (options.page !== undefined && page.value !== options.page) {
    console.log('[ViewAllUsers] Page changed from', page.value, 'to', options.page);
    page.value = options.page;
    pageChanged = true;
    needsFetch = true;
  }

  // Handle items per page changes
  if (options.itemsPerPage !== undefined && itemsPerPage.value !== options.itemsPerPage) {
    console.log('[ViewAllUsers] Items per page changed from', itemsPerPage.value, 'to', options.itemsPerPage);
    itemsPerPage.value = options.itemsPerPage;
    itemsPerPageChanged = true;
    // Reset to page 1 when changing items per page
    if (page.value !== 1) {
      page.value = 1;
      pageChanged = true;
    }
    needsFetch = true;
  }

  // Handle sorting changes
  if (options.sortBy) {
    if (options.sortBy.length > 0) {
      const sortItem = options.sortBy[0];
      if (sortBy.value !== sortItem.key || sortDesc.value !== (sortItem.order === 'desc')) {
        console.log('[ViewAllUsers] Sort changed from', { key: sortBy.value, desc: sortDesc.value }, 'to', { key: sortItem.key, desc: sortItem.order === 'desc' });
        sortBy.value = sortItem.key;
        sortDesc.value = sortItem.order === 'desc';
        sortChanged = true;
        // Reset to page 1 when changing sort
        if (page.value !== 1) {
          page.value = 1;
          pageChanged = true;
        }
        needsFetch = true;
      }
    } else if (sortBy.value !== null) { // If sortBy is cleared
      console.log('[ViewAllUsers] Sort cleared');
      sortBy.value = null;
      sortDesc.value = false;
      sortChanged = true;
      if (page.value !== 1) {
        page.value = 1;
        pageChanged = true;
      }
      needsFetch = true;
    }
  }

  if (needsFetch) {
    const fetchParams = {
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value || '',
      sortDesc: sortDesc.value,
      search: searchQuery.value
    };
    
    console.log('[ViewAllUsers] Fetching users due to options change:', {
      ...fetchParams,
      changes: { pageChanged, itemsPerPageChanged, sortChanged }
    });
    
    try {
      await usersFetchService.fetchUsers(fetchParams);
      
      console.log('[ViewAllUsers] Fetch completed. New state:', {
        page: page.value,
        itemsPerPage: itemsPerPage.value,
        totalItems: totalItems.value,
        usersCount: users.value.length
      });
    } catch (error) {
      console.error('[ViewAllUsers] Error fetching users after options change:', error);
      uiStore.showErrorSnackbar(
        error instanceof Error ? error.message : 'Error fetching users after options change'
      );
    }
  } else {
    console.log('[ViewAllUsers] No fetch needed, options did not result in state change requiring fetch.');
  }
}

// Function to perform search with debounce
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    console.log('[ViewAllUsers] Search query too short, not performing search.');
    return // Don't perform search if string length is 1
  }
  
  console.log('[ViewAllUsers] Performing search for:', searchQuery.value);
  isSearching.value = true
  
  try {
    // When searching, reset page to first
    page.value = 1
    await usersFetchService.fetchUsers({
      search: searchQuery.value,
      page: 1, // Reset to page 1 on new search
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value || '',
      sortDesc: sortDesc.value
    })
  } catch (error) {
    console.error('[ViewAllUsers] Error performing search:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Error performing search'
    )
  } finally {
    isSearching.value = false
  }
}

// Create debounced version of search function
const debouncedSearch = debounce(performSearch, 500) // Updated to 500ms

// Listen for search string changes
watch(searchQuery, (newValue, oldValue) => {
  console.log('[ViewAllUsers] Search query changed from', oldValue, 'to', newValue);
  debouncedSearch()
})

// Add handler for clearing search field
const handleClearSearch = () => {
  console.log('[ViewAllUsers] Search cleared');
  // When clicking the close icon, simply clear the field, 
  // Search with empty string will be triggered through regular watch with debounce
  searchQuery.value = '' 
}

// Enter key handler for search field
const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    console.log('[ViewAllUsers] Enter pressed in search, flushing debounce');
    debouncedSearch.cancel(); // Cancel any pending debounced calls
    performSearch(); // Perform search immediately
  }
}

// Define table columns
const headers = computed<TableHeader[]>(() => [
  { 
    title: t('list.table.headers.select'), 
    key: 'selection',
    width: '40px',
    sortable: false
  },
  { 
    title: t('list.table.headers.id'), 
    key: 'user_id', 
    width: '80px',
    sortable: true
  },
  { 
    title: t('list.table.headers.username'), 
    key: 'username',
    sortable: true
  },
  { 
    title: t('list.table.headers.email'), 
    key: 'email',
    sortable: true
  },
  { 
    title: t('list.table.headers.isStaff'), 
    key: 'is_staff', 
    width: '60px',
    sortable: true
  },
  { 
    title: t('list.table.headers.status'), 
    key: 'account_status', 
    width: '60px',
    sortable: true
  },
  { 
    title: t('list.table.headers.lastName'), 
    key: 'last_name',
    sortable: true
  },
  { 
    title: t('list.table.headers.firstName'), 
    key: 'first_name',
    sortable: true
  }
])

// Function to log pagination state with detailed information
const logPaginationState = (source: string) => {
  console.log(`[DEBUG-PAGINATION] [${source}] State:`, {
    page: page.value,
    itemsPerPage: itemsPerPage.value,
    totalItems: totalItems.value,
    userStorePage: usersStore.page,
    userStoreItemsPerPage: usersStore.itemsPerPage,
    sortBy: sortBy.value,
    sortDesc: sortDesc.value,
    search: searchQuery.value,
    usersCount: users.value.length,
    expectedPageCount: Math.ceil(totalItems.value / itemsPerPage.value)
  });
}

// Initialize on mount
onMounted(async () => {
  console.log('[ViewAllUsers] Component mounted, initializing...')
  logPaginationState('onMounted-before');
  
  try {
    // Ensure initial parameters are properly set
    const initialParams = {
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value || '',
      sortDesc: sortDesc.value,
      search: searchQuery.value
    };
    
    console.log('[ViewAllUsers] Initial parameters:', initialParams);
    
    // Load initial data, using current values (including from store)
    await usersFetchService.fetchUsers(initialParams)

    logPaginationState('onMounted-after');
  } catch (error) {
    console.error('[ViewAllUsers] Error loading initial users list:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Error loading initial users list'
    )
  }
})

// Functions for custom paginator
/**
 * Gets current page information for display
 */
const getPaginationInfo = () => {
  const start = (page.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(page.value * itemsPerPage.value, totalItems.value);
  return t('pagination.recordsInfo', { start, end, total: totalItems.value });
};

/**
 * Calculates total page count
 */
const getTotalPages = () => {
  return Math.ceil(totalItems.value / itemsPerPage.value);
};

/**
 * Gets visible page numbers for display
 */
const getVisiblePages = () => {
  const totalPages = getTotalPages();
  const currentPage = page.value;
  const pages: (number | string)[] = [];
  
  if (totalPages <= 7) {
    // If pages are few, show all
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // If pages are many, show smart pagination
    if (currentPage <= 4) {
      // At the beginning
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // At the end
      pages.push(1);
      pages.push('...');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // In the middle
      pages.push(1);
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
      pages.push(totalPages);
    }
  }
  
  return pages;
};

/**
 * Navigates to specified page
 */
const goToPage = async (newPage: number) => {
  console.log('[ViewAllUsers] Going to page:', newPage);
  
  if (newPage < 1 || newPage > getTotalPages()) {
    console.warn('[ViewAllUsers] Invalid page number:', newPage);
    return;
  }
  
  if (newPage === page.value) {
    console.log('[ViewAllUsers] Already on page:', newPage);
    return;
  }
  
  page.value = newPage;
  
  try {
    await usersFetchService.fetchUsers({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value || '',
      sortDesc: sortDesc.value,
      search: searchQuery.value
    });
    
    console.log('[ViewAllUsers] Successfully navigated to page:', newPage);
  } catch (error) {
    console.error('[ViewAllUsers] Error navigating to page:', error);
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : t('pagination.errors.navigationError')
    );
  }
};

/**
 * Handler for changing record count per page
 */
const handleItemsPerPageChange = async (newItemsPerPage: number) => {
  console.log('[ViewAllUsers] Items per page changed to:', newItemsPerPage);
  
  itemsPerPage.value = newItemsPerPage;
  page.value = 1; // Reset to first page
  
  try {
    await usersFetchService.fetchUsers({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value || '',
      sortDesc: sortDesc.value,
      search: searchQuery.value
    });
    
    console.log('[ViewAllUsers] Successfully changed items per page to:', newItemsPerPage);
  } catch (error) {
    console.error('[ViewAllUsers] Error changing items per page:', error);
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : t('pagination.errors.itemsPerPageError')
    );
  }
};
</script>

<template>
  <v-card flat>
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1">
        <!-- Search row -->
        <div class="px-4 pt-4">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            clearable
            clear-icon="mdi-close"
            color="teal"
            :label="t('list.search.placeholder')"
            prepend-inner-icon="mdi-magnify"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('list.search.minChars') : ''"
            persistent-hint
            @keydown="handleSearchKeydown"
            @click:clear="handleClearSearch"
          />
        </div>

        <v-data-table
          :page="page"
          :items-per-page="itemsPerPage"
          :headers="headers"
          :items="users"
          :loading="loading"
          :items-length="totalItems"
          :items-per-page-options="[25, 50, 100]"
          class="users-table"
          multi-sort
          :sort-by="sortBy ? [{ key: sortBy, order: sortDesc ? 'desc' : 'asc' }] : []"
          hide-default-footer
          @update:options="updateOptionsAndFetch"
        >
          <!-- Template for checkbox column -->
          <template #[`item.selection`]="{ item }">
            <v-checkbox
              :model-value="isSelected(item.user_id)"
              density="compact"
              hide-details
              @update:model-value="(value: boolean | null) => onSelectUser(item.user_id, value ?? false)"
            />
          </template>

          <template #[`item.user_id`]="{ item }">
            <span>{{ item.user_id }}</span>
          </template>

          <template #[`item.account_status`]="{ item }">
            <v-chip 
              :color="getStatusColor(item.account_status)" 
              size="x-small"
            >
              {{ item.account_status }}
            </v-chip>
          </template>

          <template #[`item.is_staff`]="{ item }">
            <v-icon
              :color="item.is_staff ? 'teal' : 'red-darken-4'"
              :icon="item.is_staff ? 'mdi-check-circle' : 'mdi-minus-circle'"
              size="x-small"
            />
          </template>
        </v-data-table>

        <!-- Custom paginator -->
        <div class="custom-pagination-container pa-4">
          <div class="d-flex align-center justify-end">
            <!-- Paginator controls -->
            <div class="d-flex align-center">
              <!-- Record count per page selector -->
              <div class="d-flex align-center mr-4">
                <span class="text-body-2 mr-2">{{ t('pagination.itemsPerPage') }}:</span>
                <v-select
                  v-model="itemsPerPage"
                  :items="[25, 50, 100]"
                  density="compact"
                  variant="outlined"
                  hide-details
                  class="items-per-page-select"
                  style="width: 100px"
                  @update:model-value="handleItemsPerPageChange"
                />
              </div>
              
              <!-- Record information -->
              <div class="text-body-2 mr-4">
                {{ getPaginationInfo() }}
              </div>
              
              <!-- Navigation buttons -->
              <div class="d-flex align-center">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page === 1"
                  @click="goToPage(1)"
                >
                  <v-icon>mdi-chevron-double-left</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('pagination.navigation.firstPage') }}
                  </v-tooltip>
                </v-btn>
                
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page === 1"
                  @click="goToPage(page - 1)"
                >
                  <v-icon>mdi-chevron-left</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('pagination.navigation.previousPage') }}
                  </v-tooltip>
                </v-btn>
                
                <!-- Page numbers -->
                <div class="d-flex align-center mx-2">
                  <template
                    v-for="pageNum in getVisiblePages()"
                    :key="pageNum"
                  >
                    <v-btn
                      v-if="pageNum !== '...'"
                      :variant="pageNum === page ? 'tonal' : 'text'"
                      size="small"
                      class="mx-1"
                      @click="goToPage(pageNum)"
                    >
                      {{ pageNum }}
                    </v-btn>
                    <span
                      v-else
                      class="mx-1"
                    >...</span>
                  </template>
                </div>
                
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page >= getTotalPages()"
                  @click="goToPage(page + 1)"
                >
                  <v-icon>mdi-chevron-right</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('pagination.navigation.nextPage') }}
                  </v-tooltip>
                </v-btn>
                
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="page >= getTotalPages()"
                  @click="goToPage(getTotalPages())"
                >
                  <v-icon>mdi-chevron-double-right</v-icon>
                  <v-tooltip
                    activator="parent"
                    location="top"
                  >
                    {{ t('pagination.navigation.lastPage') }}
                  </v-tooltip>
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sidebar (right part) -->
      <div class="side-bar-container">
        <!-- Top part of sidebar - buttons for component operations -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('list.sidebar.actions') }}
          </h3>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="hasSelected"
            @click="createUser"
          >
            {{ t('list.buttons.create') }}
          </v-btn>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :loading="loading"
            @click="refreshList"
          >
            <v-icon
              icon="mdi-refresh"
              class="mr-2"
            />
            {{ t('list.buttons.refresh') }}
          </v-btn>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="clearSelections"
          >
            <v-icon
              icon="mdi-checkbox-blank-outline"
              class="mr-2"
            />
            {{ t('list.buttons.clearSelections') }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('list.sidebar.selectedItem') }}
          </h3>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="editUser"
          >
            {{ t('list.buttons.edit') }}
          </v-btn>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="resetPassword"
          >
            {{ t('list.buttons.resetPassword') }}
          </v-btn>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="error"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="onDeleteSelected"
          >
            {{ t('list.buttons.delete') }}
            <span class="ml-2">({{ selectedCount }})</span>
          </v-btn>
        </div>
      </div>
    </div>
    
    <!-- Delete confirmation dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-wrap">
          {{ t('list.messages.confirmDelete') }}
        </v-card-title>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            class="text-none"
            @click="cancelDelete"
          >
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            class="text-none"
            @click="confirmDelete"
          >
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Password reset dialog -->
    <v-dialog 
      v-model="showPasswordDialog" 
      max-width="550"
    >
      <ChangePassword
        :title="t('passwordChange.resetPasswordFor') + ' ' + selectedUserData.username"
        :uuid="selectedUserData.uuid"
        :username="selectedUserData.username"
        :mode="PasswordChangeMode.ADMIN"
        :on-close="() => showPasswordDialog = false"
      />
    </v-dialog>

    <!-- Delete confirmation dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-wrap">
          {{ t('list.messages.confirmDelete') }}
        </v-card-title>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="text"
            class="text-none"
            @click="cancelDelete"
          >
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            class="text-none"
            @click="confirmDelete"
          >
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Password reset dialog -->
    <v-dialog 
      v-model="showPasswordDialog" 
      max-width="550"
    >
      <ChangePassword
        :title="t('passwordChange.resetPasswordFor') + ' ' + selectedUserData.username"
        :uuid="selectedUserData.uuid"
        :username="selectedUserData.username"
        :mode="PasswordChangeMode.ADMIN"
        :on-close="() => showPasswordDialog = false"
      />
    </v-dialog>
  </v-card>
</template>

<style scoped>
.users-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Styles for sidebar */
.side-bar-container {
  width: 18%; /* Increased from 15% to 18% of parent element width */
  min-width: 220px; /* Increased from 180px to 220px for better button display */
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
}

.side-bar-section {
  padding: 16px;
}

/* Divider between sections */
.sidebar-divider {
  height: 20px; /* Fixed divider height */
  position: relative;
  margin: 0 16px;
}

.sidebar-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Styles for custom paginator */
.custom-pagination-container {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  background-color: rgba(var(--v-theme-surface), 1);
}

.items-per-page-select {
  min-width: 100px;
}

.custom-pagination-container .v-btn {
  min-width: 32px;
  height: 32px;
}

.custom-pagination-container .v-btn--size-small {
  font-size: 0.875rem;
}
</style>
