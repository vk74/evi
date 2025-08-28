/**
 * @file UsersList.vue
 * Version: 1.0.07
 * Component for displaying and managing the system users list with server-side processing.
 * Features: pagination, search, sorting, user management operations (create, edit, delete, reset password).
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
import { useUsersAdminStore } from '../state.users.admin'
import loadUserService from '../UserEditor/service.load.user'
import { useUserEditorStore } from '../UserEditor/state.user.editor'
import { useUiStore } from '@/core/state/uistate'
import { useUserAuthStore } from '@/core/auth/state.user.auth'
import debounce from 'lodash/debounce'
import ChangePassword from '../../../../core/ui/modals/change-password/ChangePassword.vue'
import { PasswordChangeMode } from '../../../../core/ui/modals/change-password/types.change.password'
import PhIcon from '@/core/ui/icons/PhIcon.vue'

// Initialize stores and i18n
const { t } = useI18n()
const usersStore = useStoreUsersList()
const usersSectionStore = useUsersAdminStore()
const uiStore = useUiStore()
const userStore = useUserAuthStore()

// Table and search parameters
const page = ref<number>(usersStore.page);
const itemsPerPage = ref<ItemsPerPageOption>(usersStore.itemsPerPage as ItemsPerPageOption);
const searchQuery = ref<string>(usersStore.search || '');
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
const isAuthorized = computed(() => userStore.isAuthenticated)
const selectedCount = computed(() => usersStore.selectedCount)
const hasSelected = computed(() => usersStore.hasSelected)
const hasOneSelected = computed(() => usersStore.hasOneSelected)
const loading = computed(() => usersStore.loading)
const users = computed(() => usersStore.currentUsers)
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
    const deletedCount = await deleteSelectedUsersService.deleteSelectedUsers(usersStore.selectedUsers)
    uiStore.showSuccessSnackbar(t('list.messages.deleteUsersSuccess', { count: deletedCount }))
    await fetchUsers()
  } catch (error) {
    handleError(error, 'deleting users')
  } finally {
    showDeleteDialog.value = false
    usersStore.clearSelection()
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
              <PhIcon name="mdi-magnify" />
            </template>
            <template #clear="{ props }">
              <v-btn v-bind="props" icon variant="text"><PhIcon name="mdi-close" /></v-btn>
            </template>
          </v-text-field>
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
            <v-btn
              icon
              variant="text"
              density="comfortable"
              :aria-pressed="isSelected(item.user_id)"
              @click="onSelectUser(item.user_id, !isSelected(item.user_id))"
            >
              <PhIcon
                :name="isSelected(item.user_id) ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'"
                :color="isSelected(item.user_id) ? 'teal' : 'grey'"
                :size="18"
              />
            </v-btn>
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
            <PhIcon
              :name="item.is_staff ? 'mdi-check-circle' : 'mdi-minus-circle'"
              :color="item.is_staff ? 'teal' : 'red-darken-4'"
              size="16"
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
                  <PhIcon name="mdi-chevron-double-left" />
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
                  <PhIcon name="mdi-chevron-left" />
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
                      @click="goToPage(Number(pageNum))"
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
                  <PhIcon name="mdi-chevron-right" />
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
                  <PhIcon name="mdi-chevron-double-right" />
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
            <PhIcon name="mdi-refresh" class="mr-2" />
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
            <PhIcon name="mdi-checkbox-blank-outline" class="mr-2" />
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
  </v-card>
</template>

<style scoped>
/* Main content area */
.main-content-area {
  min-width: 0;
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

.users-table :deep(.v-data-table__td),
.users-table :deep(.v-data-table__th) {
  border-bottom: none !important;
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
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
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
</style>