<!--
/**
 * @file GroupsList.vue
 * Компонент для отображения и управления списком групп в модуле администрирования.
 *
 * Функциональность:
 * - Отображение групп в табличном виде с пагинацией
 * - Сортировка по колонкам с сохранением состояния
 * - Выбор групп для удаления или редактирования
 * - Создание новой группы
 */
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStoreGroupsList } from './state.groups.list';
import groupsService from './service.read.groups';
import type { TableHeader } from './types.groups.list';
import { useUserStore } from '@/core/state/userstate';
import { useUiStore } from '@/core/state/uistate';
import { useUsersAdminStore } from '../state.users.admin'; // Хранилище для управления секциями

// Инициализация сторов и i18n
const { t } = useI18n();
const groupsStore = useStoreGroupsList();
const userStore = useUserStore();
const uiStore = useUiStore();
const usersAdminStore = useUsersAdminStore(); // Хранилище для управления секциями

// Проверка авторизации пользователя
const isAuthorized = computed(() => userStore.isLoggedIn);

// Параметры таблицы
const page = ref<number>(groupsStore.page);
const itemsPerPage = ref<number>(groupsStore.itemsPerPage);

// Вычисляемые свойства для работы с группами
const groups = computed(() => groupsStore.getGroups);
const loading = computed(() => groupsStore.loading);
const totalItems = computed(() => groupsStore.totalItems);

// Выбранные группы
const selectedCount = computed(() => groupsStore.selectedCount);
const hasSelected = computed(() => selectedCount.value > 0);
const hasOneSelected = computed(() => selectedCount.value === 1);

// Состояние диалога подтверждения удаления
const showDeleteDialog = ref(false);

// Заголовки таблицы
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
    width: '80px' 
  },
  { 
    title: t('admin.groups.list.table.headers.name'), 
    key: 'group_name' 
  },
  { 
    title: t('admin.groups.list.table.headers.status'), 
    key: 'group_status', 
    width: '100px' 
  },
  { 
    title: t('admin.groups.list.table.headers.owner'), 
    key: 'group_owner', 
    width: '120px' 
  },
  { 
    title: t('admin.groups.list.table.headers.system'), 
    key: 'is_system', 
    width: '80px' 
  }
]);

// Функция для получения цвета статуса
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

// Функция для выбора/снятия выбора группы
const onSelectGroup = (groupId: string, selected: boolean) => {
  if (selected) {
    groupsStore.selectGroup(groupId);
  } else {
    groupsStore.deselectGroup(groupId);
  }
};

// Функция для проверки, выбрана ли группа
const isSelected = (groupId: string) => {
  return groupsStore.selectedGroups.includes(groupId);
};

// Функция для создания группы
const createGroup = () => {
  console.log('Create group clicked');
  // Устанавливаем активную секцию для перехода в GroupEditor
  usersAdminStore.setActiveSection('group-editor');
};

// Функция для редактирования группы
const editGroup = () => {
  console.log('Edit group clicked');
  // Здесь можно добавить логику для редактирования группы
};

// Функция для удаления выбранных групп
const onDeleteSelected = () => {
  showDeleteDialog.value = true;
};

// Функция для отмены удаления
const cancelDelete = () => {
  showDeleteDialog.value = false;
};

// Функция для подтверждения удаления
const confirmDelete = async () => {
  try {
    console.log('Deleting selected groups:', groupsStore.selectedGroups);
    // Здесь можно добавить логику для удаления групп
    uiStore.showSuccessSnackbar(t('admin.groups.list.messages.deleteSuccess', { count: selectedCount.value }));
  } catch (error) {
    console.error('Error deleting groups:', error);
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Ошибка удаления групп'
    );
  } finally {
    showDeleteDialog.value = false;
    groupsStore.clearSelection();
  }
};

// Загрузка данных при монтировании компонента
onMounted(async () => {
  try {
    if (!groupsStore.groups.length) {
      await groupsService.fetchGroups();
    }
  } catch (error) {
    console.error('Error loading initial groups list:', error);
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Ошибка загрузки списка групп'
    );
  }
});
</script>

<template>
  <v-card flat>
    <v-app-bar flat class="px-4 d-flex justify-space-between">
      <div class="d-flex align-center">
        <!-- Кнопка "Создать группу" -->
        <v-btn
          v-if="isAuthorized"
          color="teal"
          variant="outlined"
          class="mr-2"
          @click="createGroup"
        >
          {{ t('admin.groups.list.buttons.create') }}
        </v-btn>

        <!-- Кнопка "Редактировать" -->
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

        <!-- Кнопка "Удалить" -->
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

    <!-- Таблица с группами -->
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
      <!-- Шаблон для колонки с чекбоксами -->
      <template #[`item.selection`]="{ item }">
        <v-checkbox
          :model-value="isSelected(item.group_id)"
          density="compact"
          hide-details
          @update:model-value="(value: boolean | null) => onSelectGroup(item.group_id, value ?? false)"
        />
      </template>

      <!-- Шаблон для статуса группы -->
      <template #[`item.group_status`]="{ item }">
        <v-chip :color="getStatusColor(item.group_status)" size="x-small">
          {{ item.group_status }}
        </v-chip>
      </template>

      <!-- Шаблон для системной группы -->
      <template #[`item.is_system`]="{ item }">
        <v-icon
          :color="item.is_system ? 'teal' : 'red-darken-4'"
          :icon="item.is_system ? 'mdi-check-circle' : 'mdi-minus-circle'"
          size="x-small"
        />
      </template>
    </v-data-table>

    <!-- Диалог подтверждения удаления -->
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
            @click="confirmDelete"
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
}
</style>