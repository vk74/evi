/**
 * @file UsersList.vue
 * Version: 1.0.0
 * Component for displaying and managing the list of users in the administration module.
 * 
 * All data processing (sorting, filtering, pagination) happens locally on the client side.
 * The component loads all user records at once and performs operations on the data in memory.
 */

<template>
  <div class="users-list-container">
    <!-- Loading overlay -->
    <v-overlay
      :model-value="loading"
      class="align-center justify-center"
    >
      <v-progress-circular
        indeterminate
        size="64"
      />
    </v-overlay>

    <!-- Top app bar with actions -->
    <v-app-bar
      flat
      class="px-4"
    >
      <div class="d-flex align-center flex-wrap">
        <!-- Create user button - disabled if users are selected -->
        <v-btn
          v-if="isAuthorized"
          color="teal"
          variant="outlined"
          class="mr-2 mb-2"
          :disabled="hasSelected"
          @click="openUserEditor()"
        >
          {{ t('admin.users.list.buttons.create') }}
        </v-btn>
        
        <!-- Edit user button - enabled if exactly one user is selected -->
        <v-btn
          v-if="isAuthorized"
          color="teal"
          variant="outlined"
          class="mr-2 mb-2"
          :disabled="!hasOneSelected"
          @click="editSelectedUser()"
        >
          {{ t('admin.users.list.buttons.edit') }}
        </v-btn>
        
        <!-- Reset password button - enabled if exactly one user is selected -->
        <v-btn
          v-if="isAuthorized"
          color="teal"
          variant="outlined"
          class="mr-2 mb-2"
          :disabled="!hasOneSelected"
          @click="resetPassword()"
        >
          {{ t('admin.users.list.buttons.resetPassword') }}
        </v-btn>
        
        <!-- Delete button - enabled if at least one user is selected -->
        <v-btn
          v-if="isAuthorized"
          color="error"
          variant="outlined"
          class="mr-2 mb-2"
          :disabled="!hasSelected"
          @click="showDeleteDialog = true"
        >
          {{ t('admin.users.list.buttons.delete') }}
          <span 
            v-if="selectedCount > 0" 
            class="ml-2"
          >({{ selectedCount }})</span>
        </v-btn>

        <!-- Refresh button -->
        <v-btn
          v-if="isAuthorized"
          icon
          variant="text"
          class="mr-2 mb-2"
          :loading="loading"
          @click="refreshData"
        >
          <v-icon
            color="teal"
            icon="mdi-refresh"
          />
          <v-tooltip 
            activator="parent"
            location="bottom"
          >
            {{ t('admin.users.list.buttons.refreshHint') }}
          </v-tooltip>
        </v-btn>
      </div>

      <v-spacer />

      <v-app-bar-title class="text-subtitle-2 text-lowercase text-right hidden-sm-and-down">
        {{ t('admin.users.list.title') }}
      </v-app-bar-title>
    </v-app-bar>

    <!-- Search and filter bar -->
    <div class="px-4 pt-4">
      <v-text-field
        v-model="searchQuery"
        :label="t('admin.users.list.search.placeholder')"
        variant="outlined"
        density="compact"
        clearable
        clear-icon="mdi-close"
        color="teal"
        prepend-inner-icon="mdi-magnify"
        :loading="isSearching"
        :hint="searchQuery.length === 1 ? t('admin.users.list.search.minChars') : ''"
        persistent-hint
        @update:model-value="handleSearch"
      />
    </div>

    <!-- Error alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="ma-3"
      @click:close="usersStore.setError(null)"
    >
      {{ error }}
    </v-alert>

    <!-- Users table -->
    <v-data-table
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
      v-model:sort-by="localSortBy"
      :headers="headers"
      :items="users"
      :loading="loading"
      :items-length="totalNumOfUsers"
      item-value="user_id"
      class="users-table"
      density="compact"
      @update:sort-by="handleSortChange"
    >
      <!-- Selection column -->
      <template #header.selection>
        <v-checkbox
          v-model="selectAll"
          hide-details
          @click.stop
        />
      </template>

      <!-- Selection cell -->
      <template #item.selection="{ item }">
        <v-checkbox
          :model-value="isUserSelected(item.user_id)"
          hide-details
          @click.stop
          @change="toggleUserSelection(item.user_id)"
        ></v-checkbox>
      </template>

      <!-- Account status -->
      <template #item.account_status="{ item }">
        <v-chip
          :color="item.account_status === 'active' ? 'success' : 'error'"
          size="small"
          variant="tonal"
        >
          {{ item.account_status }}
        </v-chip>
      </template>

      <!-- Admin status -->
      <template #item.is_staff="{ item }">
        <v-icon
          v-if="item.is_staff"
          color="info"
          icon="mdi-check-circle"
        />
        <v-icon
          v-else
          color="grey"
          icon="mdi-minus-circle"
        />
      </template>

      <!-- Date formatter -->
      <template #item.created_at="{ item }">
        {{ formatDate(item.created_at) }}
      </template>

      <!-- Actions column -->
      <template #item.actions="{ item }">
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              icon="mdi-account-edit"
              size="small"
              density="compact"
              v-bind="props"
              @click.stop="editUser(item.user_id)"
            />
          </template>
          <span>{{ t('admin.users.list.buttons.edit') }}</span>
        </v-tooltip>
        
        <v-tooltip location="bottom">
          <template #activator="{ props }">
            <v-btn
              icon="mdi-lock-reset"
              size="small"
              density="compact"
              class="ml-2"
              v-bind="props"
              @click.stop="resetUserPassword(item.user_id, item.username)"
            />
          </template>
          <span>{{ t('admin.users.list.buttons.resetPassword') }}</span>
        </v-tooltip>
      </template>
      
      <!-- No data template -->
      <template #no-data>
        <p class="text-center">
          {{ t('common.messages.no_data') }}
        </p>
      </template>
    </v-data-table>

    <!-- Delete confirmation dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>{{ t('admin.users.list.messages.confirmDelete', { count: selectedCount }) }}</v-card-title>
        <v-card-text>
          {{ t('admin.users.list.messages.confirmDelete', { count: selectedCount }) }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="showDeleteDialog = false"
          >
            {{ t('common.buttons.cancel') }}
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="deleteSelectedUsers"
          >
            {{ t('common.buttons.confirm') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Password change dialog (hidden initially) -->
    <div v-if="showPasswordDialog">        <ChangePassword
        :title="t('admin.users.passwordChange.resetPasswordFor')"
        :uuid="selectedUserData.uuid"
        :username="selectedUserData.username"
        :mode="PasswordChangeMode.ADMIN"
        :on-close="() => showPasswordDialog = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStoreUsersList } from './state.users.list';
import usersService from './service.read.users';
import deleteSelectedUsersService from './service.delete.selected.users';
import type { TableHeader, ItemsPerPageOption } from './types.users.list';
import { useUserStore } from '@/core/state/userstate';
// import { useUiStore } from '@/core/state/uistate'; - not using UI store for snackbars
import { useUsersAdminStore } from '../state.users.admin';
import { useUserEditorStore } from '../UserEditor/state.user.editor';
import ChangePassword from '../../../../core/ui/modals/change-password/ChangePassword.vue';
import { PasswordChangeMode } from '../../../../core/ui/modals/change-password/types.change.password';
import { loadUserService } from '../UserEditor/service.load.user';

// Initialize stores and i18n
const { t } = useI18n();
const usersStore = useStoreUsersList();
const userStore = useUserStore();
// UI store is not used anymore since we're using console instead of showSnackbar
const usersAdminStore = useUsersAdminStore();
const userEditorStore = useUserEditorStore();

// Authentication check
const isAuthorized = computed(() => userStore.isLoggedIn);

// Table parameters
const page = ref<number>(usersStore.page);
const itemsPerPage = ref<ItemsPerPageOption>(usersStore.itemsPerPage as ItemsPerPageOption);
const searchQuery = ref<string>('');
const isSearching = ref<boolean>(false);
// Fix for sortBy format issue
const localSortBy = ref<{ key: string, order: 'asc' | 'desc' }[]>([
  { key: usersStore.sortBy, order: usersStore.sortDesc ? 'desc' : 'asc' }
]);

// Computed properties
const users = computed(() => usersStore.getUsers);
const loading = computed(() => usersStore.loading);
const error = computed(() => usersStore.error);
const totalNumOfUsers = computed(() => usersStore.totalFilteredUsers);

// Selected users state
const selectedCount = computed(() => usersStore.selectedCount);
const hasSelected = computed(() => usersStore.hasSelected);
const hasOneSelected = computed(() => usersStore.hasOneSelected);
const selectAll = ref(false);

// Dialog states
const showDeleteDialog = ref(false);
const showPasswordDialog = ref(false);

// Selected user data for operations
const selectedUserData = ref({
  uuid: '',
  username: ''
});

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.users.list.table.headers.select'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.users.list.table.headers.id'), key: 'user_id', width: '200px' },
  { title: t('admin.users.list.table.headers.username'), key: 'username', width: '150px' },
  { title: t('admin.users.list.table.headers.email'), key: 'email', width: '200px' },
  { title: t('admin.users.list.table.headers.firstName'), key: 'first_name', width: '150px' },
  { title: t('admin.users.list.table.headers.lastName'), key: 'last_name', width: '150px' },
  { title: t('admin.users.list.table.headers.middleName'), key: 'middle_name', width: '150px' },
  { title: t('admin.users.list.table.headers.status'), key: 'account_status', width: '100px' },
  { title: t('admin.users.list.table.headers.isStaff'), key: 'is_staff', width: '80px' },
  { title: t('actions', { ns: 'common' }), key: 'actions', width: '120px', sortable: false }
]);

// Watch for changes in page and items per page
watch(page, (newPage) => {
  usersStore.setPagination(newPage, itemsPerPage.value);
});

watch(itemsPerPage, (newItemsPerPage) => {
  usersStore.setPagination(page.value, newItemsPerPage);
});

// Watch for change in selection state to update selectAll checkbox
watch(users, () => {
  updateSelectAllState();
}, { deep: true });

// Methods
// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Handle search input
const handleSearch = (value: string) => {
  isSearching.value = true;
  usersStore.setSearch(value);
  isSearching.value = false;
};

// Handle sort change
const handleSortChange = (event: Array<{ key: string, order: string }>) => {
  if (event.length === 0) {
    usersStore.setSorting('username', false);
  } else {
    const { key, order } = event[0];
    usersStore.setSorting(key, order === 'desc');
  }
};

// Toggle selection of a single user
const toggleUserSelection = (userId: string) => {
  usersStore.toggleUserSelection(userId);
  updateSelectAllState();
};

// Check if a user is selected
const isUserSelected = (userId: string) => {
  return usersStore.isUserSelected(userId);
};

// Update the select all checkbox state
const updateSelectAllState = () => {
  const currentPageUserIds = users.value.map(user => user.user_id);
  selectAll.value = currentPageUserIds.length > 0 && 
                    currentPageUserIds.every(id => usersStore.isUserSelected(id));
};

// Handle select all checkbox changes
watch(selectAll, (newValue) => {
  if (newValue) {
    // Select all users on the current page
    const currentPageUserIds = users.value.map(user => user.user_id);
    usersStore.toggleSelectAll(currentPageUserIds);
  } else {
    // Deselect all users on the current page
    const currentPageUserIds = users.value.map(user => user.user_id);
    usersStore.toggleSelectAll(currentPageUserIds);
  }
});

// Delete selected users
const deleteSelectedUsers = async () => {
  try {
    await deleteSelectedUsersService.deleteSelectedUsers(usersStore.selectedUsers);
    showDeleteDialog.value = false;
    console.log(t('admin.users.list.messages.deleteUsersSuccess', { count: selectedCount.value }));
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Error deleting users: ${errorMsg}`);
  }
};

// Open user editor for creating a new user
const openUserEditor = () => {
  // Update editor store
  userEditorStore.$state.mode = { mode: 'create' };
  // Clear any existing user data
  userEditorStore.$state.account = {
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    is_staff: false,
    account_status: '',
    first_name: '',
    middle_name: '',
    last_name: ''
  };
  // Switch to the editor view
  usersAdminStore.setActiveSection('user-editor');
};

// Edit selected user (from toolbar)
const editSelectedUser = () => {
  if (usersStore.hasOneSelected) {
    const userId = usersStore.firstSelectedUserId;
    if (userId) {
      editUser(userId);
    }
  }
};

// Edit specific user (from row actions)
const editUser = async (userId: string) => {
  try {
    // Set editor mode
    userEditorStore.$state.mode = { mode: 'edit', userId: userId };
    // Load user data via the service
    await loadUserService.fetchUserById(userId);
    // Switch to editor view
    usersAdminStore.setActiveSection('user-editor');
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Error loading user: ${errorMsg}`);
  }
};

// Reset password for selected user (from toolbar)
const resetPassword = () => {
  if (usersStore.hasOneSelected) {
    const userId = usersStore.firstSelectedUserId;
    if (userId) {
      const user = usersStore.users.find(u => u.user_id === userId);
      if (user) {
        resetUserPassword(user.user_id, user.username);
      }
    }
  }
};

// Reset password for specific user (from row actions)
const resetUserPassword = (userId: string, username: string) => {
  selectedUserData.value = { uuid: userId, username };
  showPasswordDialog.value = true;
};

// Refresh data
const refreshData = async () => {
  try {
    await usersService.refreshUsers();
    console.log(t('admin.users.list.messages.refreshSuccess'));
  } catch (error: unknown) {
    // Error is already handled in the service
    console.error("Error refreshing users data:", error);
  }
};

// Initialize component
onMounted(async () => {
  if (isAuthorized.value) {
    await refreshData();
  }
});
</script>

<style scoped>
.users-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.users-table {
  flex: 1;
}

.v-table {
  overflow-x: auto;
  table-layout: fixed;
}
</style>