/**
 * @file UsersList.vue
 * Version: 1.0.09
 * Component for displaying and managing the system users list with server-side processing.
 * Features: pagination, search, sorting, user management operations (create, edit, delete, reset password).
 * FRONTEND file: UsersList.vue
 */
<script setup lang="ts">
import usersFetchService from './Service.fetch.users'
import deleteSelectedUsersService from './Service.delete.selected.users'
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStoreUsersList } from './State.users.list'
import type { 
  TableHeader, 
  ItemsPerPageOption
} from './Types.users.list'
import { useOrgAdminStore } from '../state.org.admin'
import loadUserService from '../UserEditor/service.load.user'
import { useUserEditorStore } from '../UserEditor/state.user.editor'
import { useUiStore } from '@/core/state/uistate'
import { useUserAuthStore } from '@/core/auth/state.user.auth'
import debounce from 'lodash/debounce'
import ChangePassword from '../../../../core/ui/modals/change-password/ChangePassword.vue'
import { PasswordChangeMode } from '../../../../core/ui/modals/change-password/types.change.password'
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhCheckCircle,
  PhMinusCircle,
  PhArrowClockwise,
  PhFunnel
} from '@phosphor-icons/vue'
import Paginator from '@/core/ui/paginator/Paginator.vue'

// Initialize stores and i18n
const { t } = useI18n()
const usersStore = useStoreUsersList()
const usersSectionStore = useOrgAdminStore()
const uiStore = useUiStore()
const userStore = useUserAuthStore()

// Table and search parameters
const page = ref<number>(usersStore.page);
const itemsPerPage = ref<ItemsPerPageOption>(usersStore.itemsPerPage as ItemsPerPageOption);
const searchQuery = ref<string>(usersStore.search || '');
const isSearching = ref<boolean>(false);

// Filter parameters
const statusFilter = ref<string>('all');
const staffFilter = ref<string>('all');

// Filter active indicators
const isStatusFilterActive = computed(() => statusFilter.value !== 'all');
const isStaffFilterActive = computed(() => staffFilter.value !== 'all');

// Sort tracking
const sortBy = ref<string | null>(usersStore.sortBy || null);
const sortDesc = ref<boolean>(usersStore.sortDesc);

// Dialog state
const showDeleteDialog = ref(false)
const showPasswordDialog = ref(false)
// Removed system users dialog in favor of backend-driven toasts

// Selected user data for password reset
const selectedUserData = ref({
  uuid: '',
  username: ''
})

// Computed properties
const isAuthorized = computed(() => userStore.isAuthenticated)
const selectedCount = computed(() => usersStore.selectedCount)
const hasSelected = computed(() => usersStore.hasSelected)
const hasOneSelected = computed(() => usersStore.hasOneSelected)
const loading = computed(() => usersStore.loading)
const users = computed(() => usersStore.currentUsers)
const filteredUsers = computed(() => {
  const list = users.value || [];
  let filtered = list;

  // Filter by status
  if (statusFilter.value !== 'all') {
    const status = String(statusFilter.value).toLowerCase();
    filtered = filtered.filter(u => String(u.account_status).toLowerCase() === status);
  }

  // Filter by staff
  if (staffFilter.value !== 'all') {
    const isStaff = staffFilter.value === 'yes';
    filtered = filtered.filter(u => u.is_staff === isStaff);
  }

  return filtered;
});
const filteredTotal = computed(() => filteredUsers.value.length);
const totalItems = computed(() => usersStore.totalItems)
const isSearchEnabled = computed(() => 
  searchQuery.value.length >= 2 || searchQuery.value.length === 0
)

// Helper function to get current fetch parameters
const getFetchParams = () => ({
  page: page.value,
  itemsPerPage: itemsPerPage.value,
  sortBy: sortBy.value || '',
  sortDesc: sortDesc.value,
  search: searchQuery.value
})

// Helper function for error handling
const handleError = (error: unknown, context: string) => {
  uiStore.showErrorSnackbar(
    error instanceof Error ? error.message : `Error ${context.toLowerCase()}`
  )
}

// Helper function to fetch users with current parameters
const fetchUsers = async () => {
  try {
    await usersFetchService.fetchUsers(getFetchParams())
  } catch (error) {
    handleError(error, 'fetching users')
  }
}

// User action handlers
const createUser = () => {
  try {
    const userEditorStore = useUserEditorStore()
    userEditorStore.resetForm()
    userEditorStore.mode = { mode: 'create' }
    usersSectionStore.setActiveSection('user-editor')
  } catch (error) {
    handleError(error, 'initializing create mode')
  }
}

const onSelectUser = (userId: string, selected: boolean) => {
  if (selected) {
    usersStore.selectUser(userId)
  } else {
    usersStore.deselectUser(userId)
  }
}

const isSelected = (userId: string) => usersStore.isSelected(userId)

const onDeleteSelected = () => {
  showDeleteDialog.value = true
}

const cancelDelete = () => {
  showDeleteDialog.value = false
}

const confirmDelete = async () => {
  try {
    const result = await deleteSelectedUsersService.deleteSelectedUsers(usersStore.selectedUsers)
    // Show toasts based on backend message
    if (result.success) {
      uiStore.showSuccessSnackbar(result.message)
    } else if (result.forbidden && result.forbidden.count > 0) {
      uiStore.showErrorSnackbar(result.message)
    } else {
      uiStore.showInfoSnackbar(result.message)
    }
    await fetchUsers()
    usersStore.clearSelection()
  } catch (error) {
    handleError(error, 'deleting users')
  } finally {
    showDeleteDialog.value = false
  }
}

const getStatusColor = (status: string) => {
  const colors = {
    active: 'teal',
    disabled: 'error',
    archived: 'grey',
    requires_user_action: 'orange'
  }
  return colors[status.toLowerCase() as keyof typeof colors] || 'black'
}

const getSelectedUserId = (): string => usersStore.selectedUsers[0]

const resetPassword = async () => {
  try {
    const userId = getSelectedUserId()
    const selectedUser = users.value.find(user => user.user_id === userId)
    
    if (selectedUser) {
      selectedUserData.value = {
        uuid: selectedUser.user_id,
        username: selectedUser.username
      }
      showPasswordDialog.value = true
    } else {
      uiStore.showErrorSnackbar('User not found in current list')
    }
  } catch (error) {
    handleError(error, 'preparing password reset')
  }
}

const editUser = async () => {
  try {
    const userId = getSelectedUserId()
    await loadUserService.fetchUserById(userId)
    usersSectionStore.setActiveSection('user-editor')
  } catch (error) {
    handleError(error, 'loading user data')
  }
}

const refreshList = async () => {
  try {
    usersStore.invalidateCache(getFetchParams())
    await fetchUsers()
    uiStore.showSuccessSnackbar(t('list.messages.refreshSuccess'))
  } catch (error) {
    handleError(error, 'refreshing users list')
  }
}

const clearSelections = () => {
  usersStore.clearSelection()
  uiStore.showSuccessSnackbar(t('list.messages.clearSelectionsSuccess'))
}

// Type for v-data-table sort options
type VDataTableSortByItem = { key: string; order: 'asc' | 'desc' };

// Handler for v-data-table options changes
const updateOptionsAndFetch = async (options: { page?: number, itemsPerPage?: number, sortBy?: Readonly<VDataTableSortByItem[]> }) => {
  let needsFetch = false;

  // Handle page changes
  if (options.page !== undefined && page.value !== options.page) {
    page.value = options.page;
    needsFetch = true;
  }

  // Handle items per page changes
  if (options.itemsPerPage !== undefined && itemsPerPage.value !== options.itemsPerPage) {
    itemsPerPage.value = options.itemsPerPage as ItemsPerPageOption;
    page.value = 1;
    needsFetch = true;
  }

  // Handle sorting changes
  if (options.sortBy) {
    if (options.sortBy.length > 0) {
      const sortItem = options.sortBy[0];
      if (sortBy.value !== sortItem.key || sortDesc.value !== (sortItem.order === 'desc')) {
        sortBy.value = sortItem.key;
        sortDesc.value = sortItem.order === 'desc';
        page.value = 1;
        needsFetch = true;
      }
    } else if (sortBy.value !== null) {
      sortBy.value = null;
      sortDesc.value = false;
      page.value = 1;
      needsFetch = true;
    }
  }

  if (needsFetch) {
    await fetchUsers()
  }
}

// Search functionality
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return
  }
  
  isSearching.value = true
  
  try {
    page.value = 1
    await usersFetchService.fetchUsers({
      search: searchQuery.value,
      page: 1,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value || '',
      sortDesc: sortDesc.value
    })
  } catch (error) {
    handleError(error, 'performing search')
  } finally {
    isSearching.value = false
  }
}

const debouncedSearch = debounce(performSearch, 500)

watch(searchQuery, () => {
  debouncedSearch()
})

const handleClearSearch = () => {
  searchQuery.value = '' 
}

const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    debouncedSearch.cancel();
    performSearch();
  }
}

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('list.table.headers.select'), key: 'selection', width: '40px', sortable: false },
  { title: t('list.table.headers.id'), key: 'user_id', width: '200px', sortable: true },
  { title: t('list.table.headers.username'), key: 'username', width: '150px', sortable: true },
  { title: t('list.table.headers.email'), key: 'email', width: '200px', sortable: true },
  { title: t('list.table.headers.isStaff'), key: 'is_staff', width: '60px', sortable: true },
  { title: t('list.table.headers.status'), key: 'account_status', width: '60px', sortable: true },
  { title: t('list.table.headers.lastName'), key: 'last_name', sortable: true },
  { title: t('list.table.headers.firstName'), key: 'first_name', sortable: true }
])

// Initialize on mount
onMounted(async () => {
  await fetchUsers()
})

// Pagination helpers
const getPaginationInfo = () => {
  const start = (page.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(page.value * itemsPerPage.value, totalItems.value);
  return t('pagination.recordsInfo', { start, end, total: totalItems.value });
};

const getTotalPages = () => Math.ceil(totalItems.value / itemsPerPage.value);

const getVisiblePages = () => {
  const totalPages = getTotalPages();
  const currentPage = page.value;
  const pages: (number | string)[] = [];
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push('...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...');
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, '...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
      pages.push('...', totalPages);
    }
  }
  
  return pages;
};

const goToPage = async (newPage: number) => {
  if (newPage < 1 || newPage > getTotalPages() || newPage === page.value) {
    return;
  }
  
  page.value = newPage;
  await fetchUsers();
};

const handleItemsPerPageChange = async (newItemsPerPage: ItemsPerPageOption) => {
  itemsPerPage.value = newItemsPerPage;
  page.value = 1;
  await fetchUsers();
};
</script>

<template>
  <v-card flat>
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <!-- Filters App Bar -->
        <div class="filters-container">
          <div class="d-flex align-center justify-space-between w-100 px-4 py-3">
            <div class="d-flex align-center">
              <!-- Status filter -->
              <div class="d-flex align-center mr-4">
                <v-select
                  v-model="statusFilter"
                  density="compact"
                  variant="outlined"
                  :label="t('list.filters.status')"
                  :items="[
                    { title: t('list.filters.all'), value: 'all' },
                    { title: t('list.filters.active'), value: 'active' },
                    { title: t('list.filters.disabled'), value: 'disabled' },
                    { title: t('list.filters.archived'), value: 'archived' },
                    { title: t('list.filters.requiresAction'), value: 'requires_user_action' }
                  ]"
                  color="teal"
                  :base-color="isStatusFilterActive ? 'teal' : undefined"
                  hide-details
                  style="min-width: 180px;"
                >
                  <template #append-inner>
                    <PhFunnel class="dropdown-icon" />
                  </template>
                </v-select>
              </div>

              <!-- Staff filter -->
              <div class="d-flex align-center mr-4">
                <v-select
                  v-model="staffFilter"
                  density="compact"
                  variant="outlined"
                  :label="t('list.filters.staff')"
                  :items="[
                    { title: t('list.filters.all'), value: 'all' },
                    { title: t('list.filters.yes'), value: 'yes' },
                    { title: t('list.filters.no'), value: 'no' }
                  ]"
                  color="teal"
                  :base-color="isStaffFilterActive ? 'teal' : undefined"
                  hide-details
                  style="min-width: 150px;"
                >
                  <template #append-inner>
                    <PhFunnel class="dropdown-icon" />
                  </template>
                </v-select>
              </div>
            </div>
            <div class="d-flex align-center">
              <v-spacer />
            </div>
          </div>
        </div>

        <!-- Search row -->
        <div class="px-4 pt-4">
          <v-text-field
            v-model="searchQuery"
            density="compact"
            variant="outlined"
            clearable
            color="teal"
            :label="t('list.search.placeholder')"
            :loading="isSearching"
            :hint="searchQuery.length === 1 ? t('list.search.minChars') : ''"
            persistent-hint
            @keydown="handleSearchKeydown"
            @click:clear="handleClearSearch"
          >
            <template #prepend-inner>
              <PhMagnifyingGlass />
            </template>
            <template #clear="{ props }">
              <v-btn v-bind="props" icon variant="text"><PhX /></v-btn>
            </template>
          </v-text-field>
        </div>

        <v-data-table
          :page="page"
          :items-per-page="itemsPerPage"
          :headers="headers"
          :items="filteredUsers"
          :loading="loading"
          :items-length="filteredTotal"
          :items-per-page-options="[25, 50, 100]"
          class="users-table"
          multi-sort
          :sort-by="sortBy ? [{ key: sortBy, order: sortDesc ? 'desc' : 'asc' }] : []"
          hide-default-footer
          @update:options="updateOptionsAndFetch"
        >
          <!-- Template for checkbox column -->
          <template #[`item.selection`]="{ item }">
            <v-btn
              icon
              variant="text"
              density="comfortable"
              :aria-pressed="isSelected(item.user_id)"
              @click="onSelectUser(item.user_id, !isSelected(item.user_id))"
            >
              <PhCheckSquare v-if="isSelected(item.user_id)" :size="18" color="teal" />
              <PhSquare v-else :size="18" color="grey" />
            </v-btn>
          </template>

          <template #[`item.user_id`]="{ item }">
            <span>{{ item.user_id }}</span>
          </template>

          <template #[`item.account_status`]="{ item }">
            <v-chip 
              :color="getStatusColor(item.account_status)" 
              size="x-small"
              class="status-chip"
            >
              {{ item.account_status }}
            </v-chip>
          </template>

          <template #[`item.is_staff`]="{ item }">
            <PhCheckCircle v-if="item.is_staff" size="16" color="teal" />
            <PhMinusCircle v-else size="16" color="red-darken-4" />
          </template>
        </v-data-table>

        <!-- Universal paginator -->
        <div class="custom-pagination-container pa-4">
          <Paginator
            :page="page"
            :items-per-page="itemsPerPage"
            :total-items="filteredTotal"
            :items-per-page-options="[25, 50, 100]"
            :show-records-info="true"
            @update:page="goToPage($event)"
            @update:items-per-page="handleItemsPerPageChange($event as any)"
          />
        </div>
      </div>
      
      <!-- Sidebar (now part of the main flex layout) -->
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
            <PhArrowClockwise class="mr-2" />
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
            <PhSquare class="mr-2" />
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
            variant="outlined"
            class="text-none"
            @click="cancelDelete"
          >
            {{ t('common.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="outlined"
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

    <!-- System users dialog removed; backend toasts are used instead -->
  </v-card>
</template>

<style scoped>
/* Main content area */
.main-content-area {
  min-width: 0;
}

/* Filters container styling */
.filters-container {
  background-color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

/* Table styles */
.users-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.users-table :deep(.v-data-table__tr) {
  position: relative;
}

.users-table :deep(.v-data-table__tr::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Hide the separator on the last row to avoid double line with paginator */
.users-table :deep(tbody > tr:last-child::after) {
  display: none;
}

.users-table :deep(.v-data-table__td),
.users-table :deep(.v-data-table__th) {
  border-bottom: none !important;
}

/* Header bottom separator */
.users-table :deep(thead) {
  position: relative;
}

.users-table :deep(thead::after) {
  content: '';
  position: absolute;
  bottom: 0;
  left: 7px;
  right: 17px;
  height: 1px;
  background-color: rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Sidebar styles */
.side-bar-container {
  width: 280px;
  min-width: 280px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
  background-color: rgba(var(--v-theme-surface), 1);
  overflow-y: auto;
}

.side-bar-section {
  padding: 16px;
}

.sidebar-divider {
  height: 20px;
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

/* Pagination styles */
.custom-pagination-container {
  background-color: rgba(var(--v-theme-surface), 1);
}

.items-per-page-select {
  min-width: 100px;
}

.custom-pagination-container .v-btn {
  min-width: 32px;
  height: 32px;
  font-size: 0.875rem;
}

/* Status chip styling */
.status-chip {
  font-size: 0.9em !important;
  padding: 0 9px !important;
  min-height: 22px !important;
  height: 22px !important;
}
</style>