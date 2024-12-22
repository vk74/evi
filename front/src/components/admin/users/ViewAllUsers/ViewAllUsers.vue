/**
 * @file ViewAllUsers.vue
 * Компонент для отображения и управления списком пользователей системы.
 * Работает совместно с usersListStore и usersListService.
 *
 * Функциональность:
 * - Отображение пользователей в табличном виде с пагинацией
 * - Сортировка по колонкам с сохранением состояния
 * - Управление видимостью колонок через контекстное меню
 * - Обновление списка пользователей вручную
 * - Редактирование пользователей через UserEditor
 */
<template>
  <v-card flat>
    <v-app-bar
      flat
      class="px-4 d-flex justify-space-between"
    >
      <div>
        <v-btn
          color="teal"
          variant="outlined"
          class="mr-2"
          @click="createUser"
        >
          {{ t('admin.users.list.buttons.create') }}
        </v-btn>
      </div>
      <v-app-bar-title class="text-subtitle-2 text-lowercase text-right">
        {{ t('admin.users.list.title') }}
      </v-app-bar-title>
    </v-app-bar>

    <v-data-table
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="users"
      :loading="loading"
      :items-length="totalItems"
      :items-per-page-options="[10, 25, 50, 100]"
      class="users-table"
    >
      <template #[`item.user_id`]="{ item }">
        <span>{{ item.user_id }}</span>
      </template>

      <template #[`item.account_status`]="{ item }">
        <v-chip size="x-small">
          {{ item.account_status }}
        </v-chip>
      </template>

      <template #[`item.is_staff`]="{ item }">
        <v-icon
          :color="item.is_staff ? 'teal' : 'grey'"
          :icon="item.is_staff ? 'mdi-check-circle' : 'mdi-minus-circle'"
          size="x-small"
        />
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import usersService from './service.view.all.users'
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStoreViewAllUsers } from './state.view.all.users'
import type { TableHeader } from './types.view.all.users'

// Инициализация i18n
const { t } = useI18n()

// Инициализация хранилища
const usersStore = useStoreViewAllUsers()

// Параметры таблицы
const page = ref<number>(usersStore.page)
const itemsPerPage = ref<number>(usersStore.itemsPerPage)

// Определение колонок таблицы как реактивного вычисляемого свойства
const headers = computed<TableHeader[]>(() => [
  { title: t('admin.users.list.table.headers.id'), key: 'user_id', width: '80px' },
  { title: t('admin.users.list.table.headers.username'), key: 'username' },
  { title: t('admin.users.list.table.headers.email'), key: 'email' },
  { title: t('admin.users.list.table.headers.isStaff'), key: 'is_staff', width: '60px' },
  { title: t('admin.users.list.table.headers.status'), key: 'account_status', width: '60px' },
  { title: t('admin.users.list.table.headers.lastName'), key: 'last_name' },
  { title: t('admin.users.list.table.headers.firstName'), key: 'first_name' },
  { title: t('admin.users.list.table.headers.middleName'), key: 'middle_name' }
])

// Вычисляемые свойства
const users = computed(() => usersStore.users)
const loading = computed(() => usersStore.loading)
const totalItems = computed(() => usersStore.totalItems)

/**
 * Обработчик создания нового пользователя
 */
const createUser = () => {
  // TODO: Реализовать логику создания пользователя
  console.log('Creating new user...')
}

// Инициализация при монтировании компонента
onMounted(async () => {
  try {
    if (!usersStore.users.length) {
      await usersService.fetchUsers()
    }
  } catch (error) {
    console.error('Error loading initial users list:', error)
  }
})
</script>

<style scoped>
/* Убираем высоту и overflow у таблицы */
.users-table {
  width: 100%;
  /* Важно: удаляем высоту! */
  height: auto;
  /* Важно: удаляем overflow! */
  overflow: visible;
}

/* Дополнительно, чтобы избежать "прыгания" контента при загрузке */
.v-data-table__wrapper {
    overflow: visible; /* Важно! */
}
</style>