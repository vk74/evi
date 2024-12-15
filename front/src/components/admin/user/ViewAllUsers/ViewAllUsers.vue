<!--
  @file ViewAllUsers.vue
  
  Компонент для отображения и управления списком пользователей системы.
  Работает совместно с usersListStore и usersListService.
  
  Функциональность:
  - Отображение пользователей в табличном виде с пагинацией
  - Сортировка по колонкам с сохранением состояния
  - Управление видимостью колонок через контекстное меню
  - Обновление списка пользователей вручную
  - Редактирование пользователей через UserEditor
-->

<!-- Template часть -->
<template>
  <v-card flat>
    <!-- App Bar -->
    <v-app-bar 
      flat 
      class="px-4"
    >
      <v-app-bar-title>Список пользователей</v-app-bar-title>
      <v-btn
        icon
        size="small"
        color="teal"
        variant="text"
        :loading="loading"
        @click="refreshUsers"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Таблица пользователей -->
    <v-data-table
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
      :headers="visibleHeaders"
      :items="users"
      :loading="loading"
      :items-length="totalItems"
      :sort-by="[{ key: sortBy, order: sortDesc ? 'desc' : 'asc' }]"
      :items-per-page-options="[10, 25, 50, 100]"
      class="users-table"
      @update:sort-by="handleSort"
      @contextmenu.prevent="showHeaderMenu"
    >
      <!-- Шаблон для статуса пользователя -->
      <template v-slot:item.account_status="{ item }">
        <v-chip
          :color="getStatusColor(item.raw.account_status)"
          size="small"
        >
          {{ item.raw.account_status }}
        </v-chip>
      </template>

      <!-- Шаблон для колонки "сотрудник" -->
      <template v-slot:item.is_staff="{ item }">
        <v-icon
          :color="item.raw.is_staff ? 'teal' : 'grey'"
          :icon="item.raw.is_staff ? 'mdi-check-circle' : 'mdi-minus-circle'"
          size="small"
        />
      </template>

      <!-- Шаблон для действий -->
      <template v-slot:item.actions="{ item }">
        <v-btn
          icon
          size="small"
          color="primary"
          variant="text"
          @click="editUser(item.raw)"
        >
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>
    </v-data-table>

    <!-- Контекстное меню для управления колонками -->
    <v-menu
      v-model="showMenu"
      :position-x="menuX"
      :position-y="menuY"
      absolute
    >
      <v-list>
        <v-list-item
          v-for="header in allHeaders"
          :key="header.key"
          @click="toggleColumn(header.key)"
        >
          <v-list-item-title>
            <v-checkbox
              v-model="visibleColumns"
              :value="header.key"
              :label="header.title"
              hide-details
              dense
            ></v-checkbox>
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAdminStore } from '../../adminstate'
import { useUsersListStore } from './state.view.all.users'
import { useUiStore } from '@/state/uistate'
import { SnackbarType } from '@/components/ui/snackbars/types'
import type { User } from '../type.user'
import type { AdminStateActions } from '../../types.adminstate'
import type { UiActions } from '@/state/uiStateTypes'
import type { UsersListActions } from './types.view.all.users'

/**
 * Интерфейс заголовка таблицы
 */
interface TableHeader {
  title: string;
  key: string;
  sortable: boolean;
}

// Инициализация хранилищ с типами
const adminStore = useAdminStore() as ReturnType<typeof useAdminStore> & AdminStateActions
const uiStore = useUiStore() as ReturnType<typeof useUiStore> & UiActions
const usersListStore = useUsersListStore() as ReturnType<typeof useUsersListStore> & UsersListActions

// Состояние контекстного меню
const showMenu = ref(false)
const menuX = ref<number>(0)
const menuY = ref<number>(0)

// Параметры таблицы - инициализируем из store
const page = ref<number>(usersListStore.page)
const itemsPerPage = ref<number>(usersListStore.itemsPerPage)
const sortBy = ref<string>(usersListStore.sortBy)
const sortDesc = ref<boolean>(usersListStore.sortDesc)

// Определение всех возможных колонок таблицы
const allHeaders: TableHeader[] = [
  { title: 'ID', key: 'user_id', sortable: true },
  { title: 'уч. запись', key: 'username', sortable: true },
  { title: 'e-mail', key: 'email', sortable: true },
  { title: 'сотрудник', key: 'is_staff', sortable: true },
  { title: 'статус', key: 'account_status', sortable: true },
  { title: 'действия', key: 'actions', sortable: false }
]

// Видимые колонки (по умолчанию все, кроме ID)
const visibleColumns = ref<string[]>(
  allHeaders.map(h => h.key).filter(key => key !== 'user_id')
)

// Вычисляемые свойства
const visibleHeaders = computed(() => 
  allHeaders.filter(header => visibleColumns.value.includes(header.key))
)

const users = computed(() => usersListStore.sortedUsers)
const loading = computed(() => usersListStore.loading)
const totalItems = computed(() => usersListStore.totalUsers)

/**
 * Показывает контекстное меню для управления колонками
 */
const showHeaderMenu = (event: MouseEvent) => {
  event.preventDefault()
  menuX.value = event.clientX
  menuY.value = event.clientY
  showMenu.value = true
}

/**
 * Переключает видимость колонки
 */
const toggleColumn = (key: string) => {
  const index = visibleColumns.value.indexOf(key)
  if (index === -1) {
    visibleColumns.value.push(key)
  } else {
    visibleColumns.value.splice(index, 1)
  }
}

/**
 * Обработчик изменения сортировки
 */
const handleSort = (event: { key: string; order: 'asc' | 'desc' }[]) => {
  if (event.length > 0) {
    const { key, order } = event[0]
    sortBy.value = key
    sortDesc.value = order === 'desc'
    usersListStore.setSorting(key, order === 'desc')
  }
}

/**
 * Возвращает цвет для чипа статуса пользователя
 */
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active': return 'success'
    case 'disabled': return 'error'
    case 'requires_action': return 'warning'
    default: return 'grey'
  }
}

/**
 * Обработчик нажатия на кнопку редактирования
 */
const editUser = (user: User) => {
  adminStore.setActiveUserSubModule('SubModuleUserEditor')
  // TODO: Добавить сохранение ID пользователя для редактирования
}

/**
 * Обновляет список пользователей
 */
const refreshUsers = async () => {
  try {
    await usersListStore.fetchUsers()
    uiStore.showSnackbar({
      message: 'Список пользователей успешно обновлен',
      type: SnackbarType.SUCCESS,
      timeout: 3000
    })
  } catch (error) {
    console.error('Error refreshing users list:', error)
    uiStore.showSnackbar({
      message: 'Ошибка при обновлении списка пользователей',
      type: SnackbarType.ERROR,
      timeout: 5000
    })
  }
}

// Отслеживание изменений пагинации
watch([page, itemsPerPage], ([newPage, newItemsPerPage]) => {
  usersListStore.setPagination(newPage, newItemsPerPage)
})

// Инициализация при монтировании компонента
onMounted(async () => {
  try {
    // Загружаем данные только если кеш пустой
    if (!usersListStore.users.length) {
      await usersListStore.fetchUsers()
    }
  } catch (error) {
    console.error('Error loading initial users list:', error)
    uiStore.showSnackbar({
      message: 'Ошибка при загрузке списка пользователей',
      type: SnackbarType.ERROR,
      timeout: 5000
    })
  }
})
</script>

<style scoped>
.users-table {
 width: 100%;
}

/* Стили для заголовков с сортировкой */
:deep(.v-data-table-header th) {
 white-space: nowrap;
 user-select: none;
 cursor: pointer;
}

/* Стили для активной сортировки */
:deep(.v-data-table-header th.sortable.active) {
 color: rgb(var(--v-theme-primary));
}
</style>