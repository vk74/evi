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
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import Paginator from '@/core/ui/paginator/Paginator.vue'
import { useUiStore } from '@/core/state/uistate';
import { useOrgAdminStore } from '../state.org.admin';
import { useGroupEditorStore } from '../GroupEditor/state.group.editor';
import {
  PhMagnifyingGlass,
  PhX,
  PhCheckSquare,
  PhSquare,
  PhCheckCircle,
  PhMinusCircle
} from '@phosphor-icons/vue'
// Initialize stores and i18n
const { t } = useI18n();
const groupsStore = useStoreGroupsList();
const userStore = useUserAuthStore();
const uiStore = useUiStore();
const orgAdminStore = useOrgAdminStore();
const groupEditorStore = useGroupEditorStore();

// Authentication check
const isAuthorized = computed(() => userStore.isAuthenticated);

// Table parameters
const page = ref<number>(groupsStore.page);
const itemsPerPage = ref<ItemsPerPageOption>(groupsStore.itemsPerPage as ItemsPerPageOption);
const searchQuery = ref<string>('');

// Computed properties
const groups = computed(() => groupsStore.getGroups);
const loading = computed(() => groupsStore.loading);
const totalNumOfGroups = computed(() => groupsStore.totalNumberOfGroups);

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
  { title: t('admin.groups.list.table.headers.owner'), key: 'owner_username', width: '200px' },
  { title: t('admin.groups.list.table.headers.system'), key: 'is_system', width: '80px' }
]);

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'teal';
    case 'disabled': return 'error';
    case 'archived': return 'blue';
    default: return 'blue';
  }
};

const onSelectGroup = (groupId: string, selected: boolean) => {
  if (!groupId) return;
  if (selected) groupsStore.selectGroup(groupId);
  else groupsStore.deselectGroup(groupId);
};

const isSelected = (groupId: string) => {
  if (!groupId) return false;
  return groupsStore.selectedGroups.includes(groupId);
};

const createGroup = () => {
  // Сбрасываем форму и устанавливаем режим создания
  groupEditorStore.resetForm(); // Очищает поля, сохраняя group_owner
  groupEditorStore.mode = { mode: 'create' }; // Явно устанавливаем режим создания
  orgAdminStore.setActiveSection('group-editor');
};

const editGroup = async () => {
  if (hasOneSelected.value) {
    const selectedGroupId = groupsStore.selectedGroups[0];
    try {
      const { group, details } = await fetchGroupService.fetchGroupById(selectedGroupId);
      groupEditorStore.initEditMode({
        group: group,
        details: details
      });
      orgAdminStore.setActiveSection('group-editor');
    } catch (error) {
      uiStore.showErrorSnackbar('Не удалось загрузить данные группы для редактирования');
    }
  } else {
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
    const deletedCount = await deleteSelectedGroupsService.deleteSelectedGroups(groupsStore.selectedGroups);
    uiStore.showSuccessSnackbar(t('admin.groups.list.messages.deleteSuccess', { count: deletedCount }));
    await groupsService.fetchGroups();
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Error deleting groups');
  } finally {
    showDeleteDialog.value = false;
    groupsStore.clearSelection();
  }
};

const clearSelections = () => {
  groupsStore.clearSelection();
  uiStore.showSuccessSnackbar(t('admin.groups.list.messages.clearSelectionsSuccess'));
};

onMounted(async () => {
  try {
    await groupsService.fetchGroups();
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Error loading groups list');
  }
});

watch([page, itemsPerPage], ([newPage, newItemsPerPage]) => {
  groupsStore.updateDisplayParams(newItemsPerPage, newPage);
});
</script>

<template>
  <v-card flat>
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1 main-content-area">
        <div class="px-4 pt-4">
          <v-text-field
            v-model="searchQuery"
            :label="t('admin.groups.list.search')"
            variant="outlined"
            density="compact"
            clearable
            color="teal"
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
          v-model:page="page"
          v-model:items-per-page="itemsPerPage"
          :search="searchQuery"
          :headers="headers"
          :items="groups"
          :loading="loading"
          :items-length="totalNumOfGroups"
          :items-per-page-options="[10, 25, 50, 100]"
          class="groups-table"
          hide-default-footer
          @update:page="(newPage) => page = newPage"
          @update:items-per-page="(newItemsPerPage) => itemsPerPage = newItemsPerPage as ItemsPerPageOption"
          @update:sort="(sortParams) => onSortUpdate(sortParams)"
        >
          <template #item.selection="{ item }">
            <v-btn
              icon
              variant="text"
              density="comfortable"
              :aria-pressed="isSelected(item.group_id)"
              @click="onSelectGroup(item.group_id, !isSelected(item.group_id))"
            >
              <PhCheckSquare v-if="isSelected(item.group_id)" :size="18" color="teal" />
              <PhSquare v-else :size="18" color="grey" />
            </v-btn>
          </template>
          <template #item.group_status="{ item }">
            <v-chip
              :color="getStatusColor(item.group_status)"
              size="x-small"
            >
              {{ item.group_status }}
            </v-chip>
          </template>
          <template #item.is_system="{ item }">
            <PhCheckCircle v-if="item.is_system" size="16" color="teal" />
            <PhMinusCircle v-else size="16" color="red-darken-4" />
          </template>
        </v-data-table>
        <div class="pa-4">
          <Paginator
            :page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalNumOfGroups"
            :items-per-page-options="[10, 25, 50, 100]"
            :show-records-info="true"
            @update:page="(p: number) => page = p"
            @update:items-per-page="(ipp: number) => itemsPerPage = ipp as ItemsPerPageOption"
          />
        </div>
      </div>
      
      <!-- Sidebar (right part) -->
      <div class="side-bar-container">
        <!-- Top part of sidebar - buttons for component operations -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.groups.list.sidebar.actions') }}
          </h3>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            @click="createGroup"
          >
            {{ t('admin.groups.list.buttons.create') }}
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
            <PhSquare class="mr-2" size="16" />
            {{ t('admin.groups.list.buttons.clearSelections') }}
          </v-btn>
        </div>
        
        <!-- Divider between sections -->
        <div class="sidebar-divider" />
        
        <!-- Bottom part of sidebar - buttons for operations over selected elements -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            {{ t('admin.groups.list.sidebar.selectedItem') }}
          </h3>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="teal"
            variant="outlined"
            class="mb-3"
            :disabled="!hasOneSelected"
            @click="editGroup"
          >
            {{ t('admin.groups.list.buttons.edit') }}
          </v-btn>
          
          <v-btn
            v-if="isAuthorized"
            block
            color="error"
            variant="outlined"
            class="mb-3"
            :disabled="!hasSelected"
            @click="showDeleteDialog = true"
          >
            {{ t('admin.groups.list.buttons.delete') }}
            <span class="ml-2">({{ selectedCount }})</span>
          </v-btn>
        </div>
      </div>
    </div>

    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
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
/* Main content area */
.main-content-area {
  min-width: 0;
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
</style>