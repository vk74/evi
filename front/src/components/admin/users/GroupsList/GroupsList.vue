<!--
/**
 * @file GroupsList.vue
 * Component for displaying and managing the list of groups in the administration module.
 */
-->

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStoreGroupsList } from './state.groups.list';
import groupsService from './service.read.groups';
import deleteSelectedGroupsService from './service.delete.selected.groups';
import { fetchGroupService } from '../GroupEditor/service.fetch.group';
import type { TableHeader, IGroup, ItemsPerPageOption } from './types.groups.list';
import { useUserStore } from '@/core/state/userstate';
import { useUiStore } from '@/core/state/uistate';
import { useUsersAdminStore } from '../state.users.admin';
import { useGroupEditorStore } from '../GroupEditor/state.group.editor';
// Initialize stores and i18n
const { t } = useI18n();
const groupsStore = useStoreGroupsList();
const userStore = useUserStore();
const uiStore = useUiStore();
const usersAdminStore = useUsersAdminStore();
const groupEditorStore = useGroupEditorStore();

// Authentication check
const isAuthorized = computed(() => userStore.isLoggedIn);

// Table parameters
const page = ref<number>(groupsStore.page);
const itemsPerPage = ref<ItemsPerPageOption>(groupsStore.itemsPerPage as ItemsPerPageOption);
const searchQuery = ref<string>('');

// Computed properties
const groups = computed(() => groupsStore.getGroups);
const loading = computed(() => groupsStore.loading);
const totalNumOfGroups = computed(() => {
  console.log('[Component] totalNumberOfGroups:', groupsStore.totalNumberOfGroups);
  return groupsStore.totalNumberOfGroups;
});

// Selected groups state
const selectedCount = computed(() => groupsStore.selectedCount);
const hasSelected = computed(() => selectedCount.value > 0);
const hasOneSelected = computed(() => selectedCount.value === 1);

// Delete confirmation dialog state
const showDeleteDialog = ref(false);

// Table headers
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.groups.list.table.headers.select'), key: 'selection', width: '40px', sortable: false },
  { title: t('admin.groups.list.table.headers.id'), key: 'group_id', width: '200px' },
  { title: t('admin.groups.list.table.headers.name'), key: 'group_name', width: '300px' },
  { title: t('admin.groups.list.table.headers.status'), key: 'group_status', width: '120px' },
  { title: t('admin.groups.list.table.headers.owner'), key: 'group_owner', width: '200px' },
  { title: t('admin.groups.list.table.headers.system'), key: 'is_system', width: '80px' }
]);

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'teal';
    case 'disabled': return 'red';
    case 'archived': return 'grey';
    default: return 'blue';
  }
};

const onSelectGroup = (groupId: string, selected: boolean) => {
  if (!groupId) {
    console.warn('Invalid groupId provided to onSelectGroup:', groupId);
    return;
  }
  if (selected) groupsStore.selectGroup(groupId);
  else groupsStore.deselectGroup(groupId);
  console.log('Selected groupId:', groupId);
};

const isSelected = (groupId: string) => {
  if (!groupId) {
    console.warn('Invalid groupId provided to isSelected:', groupId);
    return false;
  }
  return groupsStore.selectedGroups.includes(groupId);
};

const createGroup = () => {
  console.log('Create group clicked');
  // Сбрасываем форму и устанавливаем режим создания
  groupEditorStore.resetForm(); // Очищает поля, сохраняя group_owner
  groupEditorStore.mode = { mode: 'create' }; // Явно устанавливаем режим создания
  usersAdminStore.setActiveSection('group-editor');
};

const editGroup = async () => {
  console.log('Edit group clicked');
  if (hasOneSelected.value) {
    const selectedGroupId = groupsStore.selectedGroups[0];
    console.log('Loading group for editing with groupId:', selectedGroupId);
    try {
      const { group, details } = await fetchGroupService.fetchGroupById(selectedGroupId);
      groupEditorStore.initEditMode({
        group: group,
        details: details
      });
      usersAdminStore.setActiveSection('group-editor');
    } catch (error) {
      console.error('Error loading group for editing:', error);
      uiStore.showErrorSnackbar('Не удалось загрузить данные группы для редактирования');
    }
  } else {
    console.warn('No single group selected for editing');
    uiStore.showErrorSnackbar(t('admin.groups.list.messages.noGroupSelected'));
  }
};

const onSortUpdate = (sortParams: { key: string; order: 'asc' | 'desc' | null }) => {
  if (sortParams.key) {
    groupsStore.updateSort(sortParams.key as keyof IGroup);
    groupsStore.sorting.sortDesc = sortParams.order === 'desc';
  } else {
    groupsStore.updateSort('' as keyof IGroup);
  }
};

const onDeleteSelected = async () => {
  try {
    console.log('Deleting selected groups:', groupsStore.selectedGroups);
    const deletedCount = await deleteSelectedGroupsService.deleteSelectedGroups(groupsStore.selectedGroups);
    uiStore.showSuccessSnackbar(t('admin.groups.list.messages.deleteSuccess', { count: deletedCount }));
    await groupsService.fetchGroups();
  } catch (error) {
    console.error('Error deleting groups:', error);
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Error deleting groups');
  } finally {
    showDeleteDialog.value = false;
    groupsStore.clearSelection();
  }
};

onMounted(async () => {
  try {
    await groupsService.fetchGroups();
  } catch (error) {
    console.error('Error loading initial groups list:', error);
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Error loading groups list');
  }
});

watch([page, itemsPerPage], ([newPage, newItemsPerPage]) => {
  groupsStore.updateDisplayParams(newItemsPerPage, newPage);
});
</script>

<template>
  <v-card flat>
    <v-app-bar flat class="px-4 d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-btn
          v-if="isAuthorized"
          color="teal"
          variant="outlined"
          class="mr-2"
          @click="createGroup"
        >
          {{ t('admin.groups.list.buttons.create') }}
        </v-btn>
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
        <v-btn
          v-if="isAuthorized"
          color="error"
          variant="outlined"
          class="mr-2"
          :disabled="!hasSelected"
          @click="showDeleteDialog = true"
        >
          {{ t('admin.groups.list.buttons.delete') }}
          <span class="ml-2">({{ selectedCount }})</span>
        </v-btn>
        <v-text-field
          v-model="searchQuery"
          :label="t('admin.groups.list.search')"
          variant="outlined"
          density="compact"
          clearable
          prepend-inner-icon="mdi-magnify"
          class="ml-4"
          style="max-width: 700px; min-width: 500px;"
        />
      </div>
      <v-app-bar-title class="text-subtitle-2 text-lowercase text-right">
        {{ t('admin.groups.list.title') }}
      </v-app-bar-title>
    </v-app-bar>

    <v-data-table
      :search="searchQuery"
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="groups"
      :loading="loading"
      :items-length="totalNumOfGroups"
      :items-per-page-options="[10, 25, 50, 100]"
      class="groups-table"
      @update:page="(newPage) => page = newPage"
      @update:items-per-page="(newItemsPerPage) => itemsPerPage = newItemsPerPage"
      @update:sort="(sortParams) => onSortUpdate(sortParams)"
    >
      <template v-slot:item.selection="{ item }">
        <v-checkbox
          :model-value="isSelected(item.group_id)"
          density="compact"
          hide-details
          @update:model-value="(value: boolean | null) => onSelectGroup(item.group_id, value ?? false)"
        />
      </template>
      <template v-slot:item.group_status="{ item }">
        <v-chip :color="getStatusColor(item.group_status)" size="x-small">
          {{ item.group_status }}
        </v-chip>
      </template>
      <template v-slot:item.is_system="{ item }">
        <v-icon
          :color="item.is_system ? 'teal' : 'red-darken-4'"
          :icon="item.is_system ? 'mdi-check-circle' : 'mdi-minus-circle'"
          size="x-small"
        />
      </template>
    </v-data-table>

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
            @click="showDeleteDialog = false"
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
.v-text-field {
  margin-top: 23px;
}
</style>