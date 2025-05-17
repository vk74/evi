/**
 * @file Userslist.vue
 * Version: 1.2
 * Компонент для отображения и управления списком пользователей системы.
 *
 * Функциональность:
 * - Отображение пользователей в табличном виде с пагинацией
 * - Поиск по полям UUID, username, email, first_name, last_name
 * - Сортировка по колонкам с серверной обработкой
 * - Редактирование пользователей через UserEditor
 * - Сброс пароля пользователей через ChangePassword
 * - Оптимизированное кэширование данных
 */
<script setup lang="ts">
import usersFetchService from './service.fetch.users'
import deleteSelectedUsersService from './service.delete.selected.users'
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStoreUsersList } from './state.users.list'
import type { 
  TableHeader, 
  ItemsPerPageOption, 
  IFetchUsersParams,
  ISortParams
} from './types.users.list'
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
const page = ref<number>(usersStore.page);
const itemsPerPage = ref<ItemsPerPageOption>(usersStore.itemsPerPage as ItemsPerPageOption);
const searchQuery = ref<string>('');
const isSearching = ref<boolean>(false);

// Отслеживание сортировки
const sortBy = ref<string | null>(usersStore.sortBy || null);
const sortDesc = ref<boolean>(usersStore.sortDesc);

// Наблюдатель за изменениями параметров пагинации (как в GroupsList)
watch([page, itemsPerPage], ([newPage, newItemsPerPage]) => {
  console.log(`[DEBUG-PAGINATION] watch triggered with:`, { page: newPage, itemsPerPage: newItemsPerPage });
  
  // Загружаем пользователей с новыми параметрами
  usersFetchService.fetchUsers({
    page: newPage,
    itemsPerPage: newItemsPerPage
  });
});

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
    
    // Обновляем список пользователей после удаления
    await usersFetchService.fetchUsers()
    
  } catch (error) {
    console.error('[ViewAllUsers] Error during users deletion:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Ошибка при удалении пользователей'
    )
  } finally {
    console.log('[ViewAllUsers] Closing delete dialog')
    showDeleteDialog.value = false
    usersStore.clearSelection()
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
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Ошибка обновления списка пользователей'
    )
  }
}

// Обработчик изменения сортировки
const handleSortChange = async (sortByInfo: any) => {
  console.log('[ViewAllUsers] Sort changed:', sortByInfo)
  
  if (!sortByInfo || sortByInfo.length === 0) {
    // Если сортировка отключена, сбрасываем
    sortBy.value = null
    sortDesc.value = false
    
    try {
      await usersFetchService.fetchUsers({
        sortBy: '',
        sortDesc: false
      })
    } catch (error) {
      console.error('[ViewAllUsers] Error resetting sort:', error)
      uiStore.showErrorSnackbar(
        error instanceof Error ? error.message : 'Ошибка при сбросе сортировки'
      )
    }
    return
  }
  
  // Парсим информацию о сортировке
  const sortItem = sortByInfo[0]
  let column: string
  let direction: boolean
  
  if (typeof sortItem === 'string') {
    // Если строка в формате "column:asc" или "column:desc"
    const [col, dir] = sortItem.split(':')
    column = col
    direction = dir === 'desc'
  } else if (sortItem && typeof sortItem === 'object') {
    // Если объект в формате { key: 'column', order: 'asc'/'desc' }
    column = sortItem.key
    direction = sortItem.order === 'desc'
  } else {
    console.error('[ViewAllUsers] Invalid sort info format:', sortItem)
    return
  }
  
  // Обновляем локальное состояние
  sortBy.value = column
  sortDesc.value = direction
  
  // Отправляем запрос на сервер
  try {
    await usersFetchService.fetchUsers({
      sortBy: column,
      sortDesc: direction,
      page: page.value,
      itemsPerPage: itemsPerPage.value
    })
  } catch (error) {
    console.error('[ViewAllUsers] Error updating sort:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Ошибка при обновлении сортировки'
    )
  }
}

// Функция поиска с debounce
const performSearch = async () => {
  if (!isSearchEnabled.value && searchQuery.value.length === 1) {
    return // Не выполняем поиск если длина строки 1 символ
  }
  
  isSearching.value = true
  
  try {
    // При поиске сбрасываем страницу на первую
    page.value = 1
    await usersFetchService.fetchUsers({
      search: searchQuery.value,
      page: 1,
      sortBy: sortBy.value || '',
      sortDesc: sortDesc.value
    })
  } catch (error) {
    console.error('[ViewAllUsers] Error performing search:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Ошибка при выполнении поиска'
    )
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

// Функция для логирования состояния пагинации
const logPaginationState = (source: string) => {
  console.log(`[DEBUG-PAGINATION] [${source}] State:`, {
    page: page.value,
    itemsPerPage: itemsPerPage.value,
    totalItems: totalItems.value,
    userStorePage: usersStore.page,
    userStoreItemsPerPage: usersStore.itemsPerPage
  });
}

// Инициализация при монтировании компонента
onMounted(async () => {
  console.log('[ViewAllUsers] Component mounted, initializing...')
  logPaginationState('onMounted-before');
  
  try {
    // Загружаем начальные данные
    await usersFetchService.fetchUsers({
      page: page.value,
      itemsPerPage: itemsPerPage.value,
      sortBy: sortBy.value || '',
      sortDesc: sortDesc.value
    })

    logPaginationState('onMounted-after');
  } catch (error) {
    console.error('[ViewAllUsers] Error loading initial users list:', error)
    uiStore.showErrorSnackbar(
      error instanceof Error ? error.message : 'Ошибка при загрузке списка пользователей'
    )
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

    <!-- v-data-table с отладочной информацией о пагинации -->
    <div class="px-4 pb-2 d-flex align-center">
      <div v-if="true" class="text-caption">
        Page: {{ page }} | Items per page: {{ itemsPerPage }} | Total: {{ totalItems }} | 
        Store Page: {{ usersStore.page }} | Store Items: {{ usersStore.itemsPerPage }}
      </div>
    </div>

    <v-data-table
      :search="searchQuery"
      v-model:page="page"
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :items="users"
      :loading="loading"
      :items-length="totalItems"
      :items-per-page-options="[25, 50, 100]"
      class="users-table"
      multi-sort
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
        <v-chip 
          :color="getStatusColor(item.account_status)" 
          size="x-small"
        >
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
.users-table :deep(.v-data-table-footer) {
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>