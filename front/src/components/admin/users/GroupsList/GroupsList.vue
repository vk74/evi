<!--
/**
 * @file GroupsList.vue
 * Component for displaying and managing the list of groups in the administration module.
 *
 * Functionality:
 * - Displays groups in a table with pagination
 * - Sorts columns with state preservation
 * - Selects groups for deletion or editing
 * - Creates a new group
 */
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStoreGroupsList } from './state.groups.list';
import groupsService from './service.read.groups';
import deleteSelectedGroupsService from './service.delete.selected.groups';
import type { TableHeader } from './types.groups.list';
import { useUserStore } from '@/core/state/userstate';
import { useUiStore } from '@/core/state/uistate';
import { useUsersAdminStore } from '../state.users.admin';

// ==================== STORE AND I18N INITIALIZATION ====================
const { t } = useI18n();
const groupsStore = useStoreGroupsList();
const userStore = useUserStore();
const uiStore = useUiStore();
const usersAdminStore = useUsersAdminStore();

// ==================== AUTHENTICATION CHECK ====================
const isAuthorized = computed(() => userStore.isLoggedIn);

// ==================== TABLE PARAMETERS ====================
const page = ref<number>(groupsStore.page);
const itemsPerPage = ref<number>(groupsStore.itemsPerPage);

// ==================== COMPUTED PROPERTIES ====================
const groups = computed(() => groupsStore.getGroups);
const loading = computed(() => groupsStore.loading);
const totalItems = computed(() => groupsStore.totalItems);

// ==================== SELECTED GROUPS ====================
const selectedCount = computed(() => groupsStore.selectedCount);
const hasSelected = computed(() => selectedCount.value > 0);
const hasOneSelected = computed(() => selectedCount.value === 1);

// ==================== DELETE CONFIRMATION DIALOG STATE ====================
const showDeleteDialog = ref(false);

// ==================== TABLE HEADERS ====================
const headers = computed<TableHeader[]>(() => [
  { 
    title: t('admin.groups.list.table.headers.select'), 
    key: 'selection',
    width: '40px',
    sortable: false
  },
  { 
    title: t('admin.groups.list.table.headers.id'), 
    key: 'group_id', 
    width: '200px'
  },
  { 
    title: t('admin.groups.list.table.headers.name'), 
    key: 'group_name', 
    width: '300px'
  },
  { 
    title: t('admin.groups.list.table.headers.status'), 
    key: 'group_status', 
    width: '120px'
  },
  { 
    title: t('admin.groups.list.table.headers.owner'), 
    key: 'group_owner', 
    width: '200px'
  },
  { 
    title: t('admin.groups.list.table.headers.system'), 
    key: 'is_system', 
    width: '80px'
  }
]);

// ==================== GROUP HANDLING FUNCTIONS ====================

/**
 * Gets the color for the group status
 * @param status - Group status
 * @returns Color for the status
 */
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'green';
    case 'disabled':
      return 'red';
    case 'archived':
      return 'grey';
    default:
      return 'blue';
  }
};

/**
 * Selects or deselects a group
 * @param groupId - Group ID
 * @param selected - Selection flag
 */
const onSelectGroup = (groupId: string, selected: boolean) => {
  if (selected) {
    groupsStore.selectGroup(groupId);
  } else {
    groupsStore.deselectGroup(groupId);
  }
};

/**
 * Checks if a group is selected
 * @param groupId - Group ID
 * @returns Selection flag
 */
const isSelected = (groupId: string) => {
  return groupsStore.selectedGroups.includes(groupId);
};

/**
 * Handles group creation
 */
const createGroup = () => {
  console.log('Create group clicked');
  usersAdminStore.setActiveSection('group-editor');
};

/**
 * Handles group editing
 */
const editGroup = () => {
  console.log('Edit group clicked');
  // Add logic for editing a group here
};

/**
 * Handles group deletion
 */
 const onDeleteSelected = async () => {
  try {
    console.log('Deleting selected groups:', groupsStore.selectedGroups);

    // Call the service to delete selected groups
    const deletedCount = await deleteSelectedGroupsService.deleteSelectedGroups(groupsStore.selectedGroups);

    // Show success notification
    uiStore.showSuccessSnackbar(t('admin.groups.list.messages.deleteSuccess', { count: deletedCount }));

    // Перезагружаем группы после удаления
    await groupsService.fetchGroups();

  } catch (error) {
    console.error('Error deleting groups:', error);
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Error deleting groups'
    );
  } finally {
    // Close the delete confirmation dialog
    showDeleteDialog.value = false;

    // Clear the selection
    groupsStore.clearSelection();
  }
};

/**
 * Cancels the delete operation
 */
const cancelDelete = () => {
  showDeleteDialog.value = false;
};

// ==================== LIFECYCLE HOOKS ====================

/**
 * Fetches groups when the component is mounted
 */
onMounted(async () => {
  try {
    if (!groupsStore.groups.length) {
      await groupsService.fetchGroups();
    }
  } catch (error) {
    console.error('Error loading initial groups list:', error);
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Error loading groups list'
    );
  }
});
</script>

<template>
  <v-card flat>
    <v-app-bar flat class="px-4 d-flex justify-space-between">
      <div class="d-flex align-center">
        <!-- Create Group Button -->
        <v-btn
          v-if="isAuthorized"
          color="teal"
          variant="outlined"
          class="mr-2"
          @click="createGroup"
        >
          {{ t('admin.groups.list.buttons.create') }}
        </v-btn>

        <!-- Edit Group Button -->
        <v-btn
          v-if="isAuthorized"
          color="teal"
          variant="outlined"
          class="mr-2"
          :disabled="!hasOneSelected"
          @click="editGroup"
        >
          {{ t('admin.groups.list.buttons.edit') }}
        </v-btn>

        <!-- Delete Group Button -->
        <v-btn
          v-if="isAuthorized"
          color="error"
          variant="outlined"
          class="mr-2"
          :disabled="!hasSelected"
          @click="onDeleteSelected"
        >
          {{ t('admin.groups.list.buttons.delete') }}
          <span class="ml-2">({{ selectedCount }})</span>
        </v-btn>
      </div>

      <v-app-bar-title class="text-subtitle-2 text-lowercase text-right">
        {{ t('admin.groups.list.title') }}
      </v-app-bar-title>
    </v-app-bar>

    <!-- Groups Table -->
    <v-data-table
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="groups"
      :loading="loading"
      :items-length="totalItems"
      :items-per-page-options="[10, 25, 50, 100]"
      class="groups-table"
    >
      <!-- Selection Checkbox Template -->
      <template #[`item.selection`]="{ item }">
        <v-checkbox
          :model-value="isSelected(item.group_id)"
          density="compact"
          hide-details
          @update:model-value="(value: boolean | null) => onSelectGroup(item.group_id, value ?? false)"
        />
      </template>

      <!-- Group Status Template -->
      <template #[`item.group_status`]="{ item }">
        <v-chip :color="getStatusColor(item.group_status)" size="x-small">
          {{ item.group_status }}
        </v-chip>
      </template>

      <!-- System Group Template -->
      <template #[`item.is_system`]="{ item }">
        <v-icon
          :color="item.is_system ? 'teal' : 'red-darken-4'"
          :icon="item.is_system ? 'mdi-check-circle' : 'mdi-minus-circle'"
          size="x-small"
        />
      </template>
    </v-data-table>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-subtitle-1 text-wrap">
          {{ t('admin.groups.list.messages.confirmDelete') }}
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
            @click="onDeleteSelected"
          >
            {{ t('common.delete') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.groups-table {
  margin-top: 16px;
  width: 100%; /* Takes up the full available width */
}
</style>