/**
 * @file Userslist.vue
 * @version 1.0.03
 * Компонент для отображения и управления списком пользователей системы.
 *
 * Функциональность:
 * - Отображение пользователей в табличном виде с пагинацией
 * - Поиск по полям UUID, username, email, first_name, last_name
 * - Сортировка по колонкам с серверной обработкой
 * - Расширенная навигация по страницам (первая, предыдущая, следующая, последняя)
 * - Редактирование пользователей через UserEditor
 * - Сброс пароля пользователей через ChangePassword
 * - Оптимизированное кэширование данных
 * - Корректное отображение счетчика общего количества записей
 * - Выбор количества записей на странице
 */
<script setup lang="ts">
import usersFetchService from './service.fetch.users'
import deleteSelectedUsersService from './service.delete.selected.users'
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStoreUsersList } from './state.users.list'
import type { TableHeader, ItemsPerPageOption, IFetchUsersParams } from './types.users.list'
import { useUsersAdminStore } from '../state.users.admin'
import loadUserService from '../UserEditor/service.load.user'
import { useUserEditorStore } from '../UserEditor/state.user.editor'
import { useUiStore } from '@/core/state/uistate'
import { useUserStore } from '@/core/state/userstate'
import debounce from 'lodash/debounce'
import ChangePassword from '../../../../core/ui/modals/change-password/ChangePassword.vue'
import { PasswordChangeMode } from '../../../../core/ui/modals/change-password/types.change.password'

// Инициализация сторов и i18n
const { t } = useI18n()
const usersStore = useStoreUsersList()
const usersSectionStore = useUsersAdminStore()
const uiStore = useUiStore()
const userStore = useUserStore()

// Параметры таблицы и поиска
const page = ref<number>(usersStore.page)
const itemsPerPage = ref<ItemsPerPageOption>(
  // Обеспечиваем, что значение из хранилища соответствует типу ItemsPerPageOption
  (usersStore.itemsPerPage === 25 || usersStore.itemsPerPage === 50 || usersStore.itemsPerPage === 100) 
    ? usersStore.itemsPerPage as ItemsPerPageOption 
    : 25 as ItemsPerPageOption
)
const searchQuery = ref<string>('')
const isSearching = ref<boolean>(false)

// Состояние диалогов
const showDeleteDialog = ref(false)
const showPasswordDialog = ref(false)

// Данные выбранного пользователя для сброса пароля
const selectedUserData = ref({
  uuid: '',
  username: ''
})

// Вычисляемые свойства
const isAuthorized = computed(() => userStore.isLoggedIn)
const selectedCount = computed(() => usersStore.selectedCount)
const hasSelected = computed(() => usersStore.hasSelected)
const hasOneSelected = computed(() => usersStore.hasOneSelected)
const loading = computed(() => usersStore.loading)
const users = computed(() => usersStore.currentUsers)
const totalItems = computed(() => {
  console.log('[ViewAllUsers] totalItems computed value:', usersStore.totalItems)
  return usersStore.totalItems
})

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

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return 'teal';
    case 'disabled': return 'error';
    case 'archived': return 'grey';
    case 'requires_user_action': return 'orange';
    default: return 'black';
  }
};

// Функция для получения ID единственного выбранного пользователя
const getSelectedUserId = (): string => {
  console.log('[ViewAllUsers] Getting selected user ID')
  return usersStore.selectedUsers[0]
}

// Функция для обработки клика по кнопке сброса пароля
const resetPassword = async () => {
  console.log('[ViewAllUsers] Starting reset password operation')
  
  try {
    const userId = getSelectedUserId()
    console.log('[ViewAllUsers] Selected user ID for password reset:', userId)
    
    // Находим выбранного пользователя в текущем списке
    const selectedUser = users.value.find(user => user.user_id === userId)
    
    if (selectedUser) {
      // Сохраняем данные выбранного пользователя
      selectedUserData.value = {
        uuid: selectedUser.user_id,
        username: selectedUser.username
      }
      
      // Открываем диалог сброса пароля
      showPasswordDialog.value = true
    } else {
      console.error('[ViewAllUsers] Selected user not found in current list')
      uiStore.showErrorSnackbar('Пользователь не найден в текущем списке')
    }
  } catch (error) {
    console.error('[ViewAllUsers] Error preparing password reset:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Ошибка при подготовке сброса пароля'
    )
  }
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

// Функции навигации для пагинатора
const goToPrevPage = () => {
  console.log('[ViewAllUsers] Navigate to previous page')
  
  if (page.value > 1) {
    const newPage = page.value - 1
    handlePageChange(newPage)
  }
}

const goToNextPage = () => {
  console.log('[ViewAllUsers] Navigate to next page')
  
  const maxPage = Math.ceil(totalItems.value / itemsPerPage.value)
  if (page.value < maxPage) {
    const newPage = page.value + 1
    handlePageChange(newPage)
  }
}

const goToFirstPage = () => {
  console.log('[ViewAllUsers] Navigate to first page')
  
  if (page.value !== 1) {
    handlePageChange(1)
  }
}

const goToLastPage = () => {
  console.log('[ViewAllUsers] Navigate to last page')
  
  const maxPage = Math.ceil(totalItems.value / itemsPerPage.value)
  if (page.value !== maxPage) {
    handlePageChange(maxPage)
  }
}

// Обработчик изменения страницы и количества элементов на странице
const updatePagination = async (newPage?: number, newItemsPerPage?: ItemsPerPageOption) => {
  // Используем типизированный объект вместо any
  const params: Partial<IFetchUsersParams> = {}
  
  if (newPage !== undefined) {
    params.page = newPage
  }
  
  if (newItemsPerPage !== undefined) {
    params.itemsPerPage = newItemsPerPage
  }
  
  console.log('[ViewAllUsers] Updating pagination with params:', params)
  
  try {
    await usersFetchService.fetchUsers(params)
    console.log('[ViewAllUsers] After pagination update, totalItems:', totalItems.value)
  } catch (error) {
    console.error('[ViewAllUsers] Error updating pagination:', error)
  }
}

// Обработчики событий таблицы
const handlePageChange = (newPage: number) => {
  page.value = newPage
  updatePagination(newPage)
}

const handleItemsPerPageChange = (newItemsPerPage: number) => {
  console.log('[ViewAllUsers] Items per page changed:', newItemsPerPage, 'current totalItems:', totalItems.value)
  // Приводим к типу ItemsPerPageOption
  const validItemsPerPage = (newItemsPerPage === 25 || newItemsPerPage === 50 || newItemsPerPage === 100) 
    ? newItemsPerPage as ItemsPerPageOption 
    : 25 as ItemsPerPageOption
  
  itemsPerPage.value = validItemsPerPage
  updatePagination(page.value, validItemsPerPage)
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
    // Логируем общее количество записей после загрузки
    console.log('[ViewAllUsers] Total items after initial load:', totalItems.value)
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
          color="teal"
          variant="outlined"
          class="mr-2 mb-2"
          :disabled="!hasOneSelected"
          @click="resetPassword"
        >
          {{ t('list.buttons.resetPassword') }}
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
          :loading="loading"
          @click="refreshList"
        >
          <v-icon
            color="teal"
          >
            mdi-refresh
          </v-icon>
          <v-tooltip 
            activator="parent" 
            location="bottom"
          >
            {{ t('list.buttons.refreshHint') }}
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
        :placeholder="t('list.search.placeholder')"
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
      :items-per-page-options="[25, 50, 100]"
      :server-items-length="totalItems"
      must-sort
      class="users-table"
      @update:page="handlePageChange"
      @update:items-per-page="handleItemsPerPageChange"
      @update:sort-by="handleSortChange"
    >
      <!-- Используем шаблон bottom для замены стандартного футера -->
      <template #bottom>
        <div class="d-flex align-center justify-end pa-4">
          <div class="d-flex align-center">
            <div class="d-flex align-center mr-4">
              <span class="text-caption mr-2">Items per page:</span>
              <v-select
                v-model="itemsPerPage"
                density="compact"
                variant="outlined"
                hide-details
                :items="[25, 50, 100]"
                style="width: 90px; min-width: 90px;"
              />
            </div>
            <span class="text-caption mr-4">
              {{ (page - 1) * itemsPerPage + 1 }}-{{ Math.min(page * itemsPerPage, totalItems) }} of {{ totalItems }}
            </span>
            <div class="d-flex align-center">
              <v-btn
                icon="mdi-page-first"
                size="small"
                variant="text"
                class="mr-1"
                :disabled="page === 1"
                @click="goToFirstPage"
              />
              <v-btn
                icon="mdi-chevron-left"
                size="small"
                variant="text"
                class="mr-1"
                :disabled="page === 1"
                @click="goToPrevPage"
              />
              <v-btn
                icon="mdi-chevron-right"
                size="small"
                variant="text"
                class="mr-1"
                :disabled="page >= Math.ceil(totalItems / itemsPerPage)"
                @click="goToNextPage"
              />
              <v-btn
                icon="mdi-page-last"
                size="small"
                variant="text"
                :disabled="page >= Math.ceil(totalItems / itemsPerPage)"
                @click="goToLastPage"
              />
            </div>
          </div>
        </div>
      </template>
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
    
    <!-- Модальное окно сброса пароля -->
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
/* Стили для компонента UsersList */
</style>