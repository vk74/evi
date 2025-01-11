/**
 * @file Userslist.vue
 * Компонент для отображения и управления списком пользователей системы.
 *
 * Функциональность:
 * - Отображение пользователей в табличном виде с пагинацией
 * - Сортировка по колонкам с сохранением состояния
 * - Управление видимостью колонок через контекстное меню
 * - Обновление списка пользователей вручную
 * - Редактирование пользователей через UserEditor
 */
 <script setup lang="ts">
 import usersService from './service.view.all.users'
 import deleteSelectedUsersService from './service.delete.selected.users'
 import { ref, computed, onMounted } from 'vue'
 import { useI18n } from 'vue-i18n'
 import { useStoreUsersList } from './state.users.list'
 import type { TableHeader } from './types.users.list'
 import { useUsersAdminStore } from '../state.users.admin'
 import loadUserService from '../UserEditor/service.load.user'
 import { useUserEditorStore } from '../UserEditor/state.user.editor'
 import { useUiStore } from '@/core/state/uistate'
 import { useUserStore } from '@/core/state/userstate'
 
 // Инициализация сторов и i18n
 const { t } = useI18n()
 const usersStore = useStoreUsersList()
 const usersSectionStore = useUsersAdminStore()
 const uiStore = useUiStore()
 const userStore = useUserStore()
 const isAuthorized = computed(() => userStore.isLoggedIn)
 
 // Параметры таблицы
 const page = ref<number>(usersStore.page)
 const itemsPerPage = ref<number>(usersStore.itemsPerPage)
 
 // Состояние диалога подтверждения удаления
 const showDeleteDialog = ref(false)
 
 // Вычисляемые свойства для работы с выбранными пользователями
 const selectedCount = computed(() => usersStore.selectedCount)
 const hasSelected = computed(() => selectedCount.value > 0)
 
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
 
 const hasOneSelected = computed(() => selectedCount.value === 1)



 const isSelected = (userId: string) => {
   return usersStore.selectedUsers.includes(userId)
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
     const message = t('admin.users.list.messages.deleteUsersSuccess', { count: deletedCount })
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
 
 // Определение колонок таблицы
 const headers = computed<TableHeader[]>(() => [
   { 
     title: t('admin.users.list.table.headers.select'), 
     key: 'selection',
     width: '40px',
     sortable: false
   },
   { 
     title: t('admin.users.list.table.headers.id'), 
     key: 'user_id', 
     width: '80px' 
   },
   { 
     title: t('admin.users.list.table.headers.username'), 
     key: 'username' 
   },
   { 
     title: t('admin.users.list.table.headers.email'), 
     key: 'email' 
   },
   { 
     title: t('admin.users.list.table.headers.isStaff'), 
     key: 'is_staff', 
     width: '60px' 
   },
   { 
     title: t('admin.users.list.table.headers.status'), 
     key: 'account_status', 
     width: '60px' 
   },
   { 
     title: t('admin.users.list.table.headers.lastName'), 
     key: 'last_name' 
   },
   { 
     title: t('admin.users.list.table.headers.firstName'), 
     key: 'first_name' 
   },
   { 
     title: t('admin.users.list.table.headers.middleName'), 
     key: 'middle_name' 
   }
 ])
 
 // Вычисляемые свойства для данных
 const users = computed(() => usersStore.users)
 const loading = computed(() => usersStore.loading)
 const totalItems = computed(() => usersStore.totalItems)
 
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

<template>
  <v-card flat>
    <v-app-bar
      flat
      class="px-4 d-flex justify-space-between"
    >
      <div class="d-flex align-center">
        <v-btn
          v-if="isAuthorized"
          color="teal"
          variant="outlined"
          class="mr-2"
          :disabled="hasSelected"
          @click="createUser"
        >
          {{ t('admin.users.list.buttons.create') }}
        </v-btn>
        
        <v-btn
          v-if="isAuthorized"
          color="teal"
          variant="outlined"
          class="mr-2"
          :disabled="!hasOneSelected"
          @click="editUser"
        >
          {{ t('admin.users.list.buttons.edit') }}
        </v-btn>
        
        <v-btn
          v-if="isAuthorized"
          color="error"
          variant="outlined"
          class="mr-2"
          :disabled="!hasSelected"
          @click="onDeleteSelected"
        >
          {{ t('admin.users.list.buttons.delete') }}
          <span class="ml-2">({{ selectedCount }})</span>
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
    </v-data-table>

    <!-- Диалог подтверждения удаления -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-subtitle-1 text-wrap">
          {{ t('admin.users.list.messages.confirmDelete') }}
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