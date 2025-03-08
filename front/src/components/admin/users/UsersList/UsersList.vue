/**
 * @file Userslist.vue
 * Компонент для отображения и управления списком пользователей системы.
 *
 * Функциональность:
 * - Отображение пользователей в табличном виде с пагинацией
 * - Поиск по полям UUID, username, email, first_name, last_name
 * - Сортировка по колонкам с серверной обработкой
 * - Редактирование пользователей через UserEditor
 * - Оптимизированное кэширование данных
 */
<script setup lang="ts">
import usersFetchService from './service.fetch.users'
import deleteSelectedUsersService from './service.delete.selected.users'
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStoreUsersList } from './state.users.list'
import type { TableHeader, ItemsPerPageOption } from './types.users.list'
import { useUsersAdminStore } from '../state.users.admin'
import loadUserService from '../UserEditor/service.load.user'
import { useUserEditorStore } from '../UserEditor/state.user.editor'
import { useUiStore } from '@/core/state/uistate'
import { useUserStore } from '@/core/state/userstate'
import debounce from 'lodash/debounce'

// Инициализация сторов и i18n
const { t } = useI18n()
const usersStore = useStoreUsersList()
const usersSectionStore = useUsersAdminStore()
const uiStore = useUiStore()
const userStore = useUserStore()

// Параметры таблицы и поиска
const page = ref<number>(usersStore.page)
const itemsPerPage = ref<ItemsPerPageOption>(usersStore.itemsPerPage)
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)

// Состояние диалога подтверждения удаления
const showDeleteDialog = ref(false)

// Вычисляемые свойства
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

// Обработчики действий с пользователями
const createUser = () => {
  console.log('[ViewAllUsers] Starting create user operation')
  
  try {
    // Получаем store для UserEditor
    const userEditorStore = useUserEditorStore()
    
    // Сбрасываем форму к начальным значениям
    userEditorStore.resetForm()
    
    // Устанавливаем режим создания
    userEditorStore.mode = {
      mode: 'create'
    }
    
    // Переключаем секцию на редактор пользователя
    usersSectionStore.setActiveSection('user-editor')
    
  } catch (error) {
    console.error('[ViewAllUsers] Error initializing create mode:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Ошибка инициализации режима создания'
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
    
  } catch (error) {
    console.error('[ViewAllUsers] Error during users deletion:', error)
  } finally {
    console.log('[ViewAllUsers] Closing delete dialog')
    showDeleteDialog.value = false
  }
}

// Функция для получения ID единственного выбранного пользователя
const getSelectedUserId = (): string => {
  console.log('[ViewAllUsers] Getting selected user ID')
  return usersStore.selectedUsers[0]
}

// Функция для обработки клика по кнопке редактирования
const editUser = async () => {
  console.log('[ViewAllUsers] Starting edit user operation')
  
  try {
    const userId = getSelectedUserId()
    console.log('[ViewAllUsers] Selected user ID:', userId)
    
    // Загружаем данные пользователя
    await loadUserService.fetchUserById(userId)
    console.log('[ViewAllUsers] User data loaded successfully')
    
    // Переходим к редактированию
    usersSectionStore.setActiveSection('user-editor')
    
  } catch (error) {
    console.error('[ViewAllUsers] Error loading user data:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Ошибка загрузки данных пользователя'
    )
  }
}

// Функция принудительного обновления списка
const refreshList = async () => {
  console.log('[ViewAllUsers] Forcing refresh of users list')
  try {
    await usersFetchService.refreshUsers()
    uiStore.showSuccessSnackbar(t('list.messages.refreshSuccess'))
  } catch (error) {
    console.error('[ViewAllUsers] Error refreshing users list:', error)
  }
}

// Обработчик изменения страницы и количества элементов на странице
const updatePagination = async (newPage?: number, newItemsPerPage?: ItemsPerPageOption) => {
  const params: any = {}
  
  if (newPage !== undefined) {
    params.page = newPage
  }
  
  if (newItemsPerPage !== undefined) {
    params.itemsPerPage = newItemsPerPage
  }
  
  try {
    await usersFetchService.fetchUsers(params)
  } catch (error) {
    console.error('[ViewAllUsers] Error updating pagination:', error)
  }
}

// Обработчики событий таблицы
const handlePageChange = (newPage: number) => {
  page.value = newPage
  updatePagination(newPage)
}

const handleItemsPerPageChange = (newItemsPerPage: ItemsPerPageOption) => {
  itemsPerPage.value = newItemsPerPage
  updatePagination(page.value, newItemsPerPage)
}

// Обработчик изменения сортировки
const handleSortChange = async (sortBy: string[]) => {
  // v-data-table возвращает массив полей и направлений
  // В нашем случае мы используем только первое поле
  if (sortBy.length > 0) {
    const [column, direction] = sortBy[0].split(':')
    const sortDesc = direction === 'desc'
    
    try {
      await usersFetchService.fetchUsers({
        sortBy: column,
        sortDesc
      })
    } catch (error) {
      console.error('[ViewAllUsers] Error updating sort:', error)
    }
  }
}

// Функция поиска с debounce
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return // Не выполняем поиск если длина строки 1 символ
  }
  
  isSearching.value = true
  
  try {
    await usersFetchService.fetchUsers({
      search: searchQuery.value,
      page: 1 // Сбрасываем страницу при поиске
    })
  } catch (error) {
    console.error('[ViewAllUsers] Error performing search:', error)
  } finally {
    isSearching.value = false
  }
}

// Создаем debounced версию функции поиска
const debouncedSearch = debounce(performSearch, 800)

// Слушаем изменения строки поиска
watch(searchQuery, () => {
  debouncedSearch()
})

// Добавляем обработчик очистки поля поиска
const handleClearSearch = () => {
  // При нажатии на крестик просто очищаем поле, но не запускаем поиск
  // Поиск с пустой строкой будет запущен через обычный watch с debounce
  searchQuery.value = ''
}

// Обработчик нажатия Enter в поле поиска
const handleSearchKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    debouncedSearch.flush() // Немедленно выполняем поиск
  }
}

// Определение колонок таблицы
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
  },
  { 
    title: t('list.table.headers.middleName'), 
    key: 'middle_name',
    sortable: true
  }
])

// Инициализация при монтировании компонента
onMounted(async () => {
  try {
    // Загружаем данные, даже если они есть в кэше
    // это позволит использовать кэш если данные актуальны
    await usersFetchService.fetchUsers()
  } catch (error) {
    console.error('[ViewAllUsers] Error loading initial users list:', error)
  }
})
</script>

<template>
  <v-card flat>
    <v-app-bar
      flat
      class="px-4"
    >
      <div class="d-flex align-center flex-wrap">
        <v-btn
          v-if="isAuthorized"
          color="teal"
          variant="outlined"
          class="mr-2 mb-2"
          :disabled="hasSelected"
          @click="createUser"
        >
          {{ t('list.buttons.create') }}
        </v-btn>
        
        <v-btn
          v-if="isAuthorized"
          color="teal"
          variant="outlined"
          class="mr-2 mb-2"
          :disabled="!hasOneSelected"
          @click="editUser"
        >
          {{ t('list.buttons.edit') }}
        </v-btn>
        
        <v-btn
          v-if="isAuthorized"
          color="error"
          variant="outlined"
          class="mr-2 mb-2"
          :disabled="!hasSelected"
          @click="onDeleteSelected"
        >
          {{ t('list.buttons.delete') }}
          <span class="ml-2">({{ selectedCount }})</span>
        </v-btn>
        
        <v-btn
          v-if="isAuthorized"
          icon
          variant="text"
          class="mr-2 mb-2"
          @click="refreshList"
          :loading="loading"
          :title="t('list.buttons.refreshHint', 'Обновить список пользователей')"
        >
          <v-icon>mdi-refresh</v-icon>
          <v-tooltip activator="parent" location="bottom">
            {{ t('list.buttons.refreshHint', 'Обновить список пользователей') }}
          </v-tooltip>
        </v-btn>
      </div>

      <v-spacer />

      <v-app-bar-title class="text-subtitle-2 text-lowercase text-right hidden-sm-and-down">
        {{ t('list.title') }}
      </v-app-bar-title>
    </v-app-bar>
    
    <!-- Строка поиска -->
    <div class="px-4 pb-2">
      <v-text-field
        v-model="searchQuery"
        density="compact"
        variant="outlined"
        hide-details
        clearable
        clear-icon="mdi-close"
        color="teal"
        :placeholder="t('list.search.placeholder', 'Поиск пользователей...')"
        prepend-inner-icon="mdi-magnify"
        :loading="isSearching"
        :hint="searchQuery.length === 1 ? t('list.search.minChars') : ''"
        persistent-hint
        @keydown="handleSearchKeydown"
        @click:clear="handleClearSearch"
      />
    </div>

    <v-data-table
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="users"
      :loading="loading"
      :items-length="totalItems"
      :items-per-page-options="[25, 50, 100]"
      class="users-table"
      @update:page="handlePageChange"
      @update:items-per-page="handleItemsPerPageChange"
      @update:sort-by="handleSortChange"
    >
      <!-- Шаблон для колонки с чекбоксами -->
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
        <v-chip size="x-small">
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
      
      <!-- Нижняя часть таблицы с общим числом записей -->
      <!-- Не используем шаблон #bottom, чтобы сохранить стандартную пагинацию -->
    </v-data-table>

    <!-- Диалог подтверждения удаления -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-wrap">
          {{ t('list.messages.confirmDelete', { count: selectedCount }) }}
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
/* Стиль для крестика очистки */
:deep(.v-field__clearable) .v-icon {
  color: teal !important;
}
</style>