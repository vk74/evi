<!--
  ViewAllUsers.vue
  Компонент для отображения списка всех пользователей системы.
  
  Функциональность:
  - Отображение пользователей в табличном виде
  - Сортировка по колонкам
  - Управление видимостью колонок через контекстное меню
  - Пагинация с сохранением сортировки
-->

<template>
    <v-container class="pa-0">
      <!-- Таблица пользователей -->
      <v-card flat>
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
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useAdminStore } from '@/state/adminstate'
  import { useUsersListStore } from '@/state/usersListState'
  

  interface User {
    user_id: number;
    username: string;
    email: string;
    account_status: 'active' | 'disabled' | 'suspended' | string;
    [key: string]: any;
  }

  interface TableHeader {
    title: string;
    key: string;
    sortable: boolean;
  }

  // Инициализация необходимых объектов
  const adminStore = useAdminStore()
  const usersListStore = useUsersListStore()
  
  // Состояние меню
  const showMenu = ref(false)
  const menuX = ref<number>(0)
  const menuY = ref<number>(0)
  
  // Параметры таблицы
  const page = ref<number>(1)
  const itemsPerPage = ref<number>(25)
  const sortBy = ref<string>('username')
  const sortDesc = ref<boolean>(false)
  
  // Определение всех возможных колонок
  const allHeaders = [
    { title: 'ID', key: 'user_id', sortable: true },
    { title: 'уч. запись', key: 'username', sortable: true },
    { title: 'e-mail', key: 'email', sortable: true },
    { title: 'статус', key: 'account_status', sortable: true },
    { title: 'действия', key: 'actions', sortable: false }
  ]
  
  // Видимые колонки (по умолчанию все, кроме ID)
  const visibleColumns = ref<string>(allHeaders.map(h => h.key).filter(key => key !== 'user_id'))
  
  // Вычисляемые свойства
  const visibleHeaders = computed(() => 
    allHeaders.filter(header => visibleColumns.value.includes(header.key))
  )
  
  const users = computed(() => usersListStore.sortedUsers)
  const loading = computed(() => usersListStore.loading)
  const totalItems = computed(() => usersListStore.totalUsers)
  
  // Методы
  const showHeaderMenu = (event: MouseEvent) => {
    event.preventDefault()
    menuX.value = event.clientX
    menuY.value = event.clientY
    showMenu.value = true
  }
  
  const toggleColumn = (key: string) => {
    const index = visibleColumns.value.indexOf(key)
    if (index === -1) {
      visibleColumns.value.push(key)
    } else {
      visibleColumns.value.splice(index, 1)
    }
  }
  
  interface SortEvent {
    key: string;
    order: 'asc' | 'desc';
  }

  const handleSort = (event: SortEvent) => {
    if (event.length > 0) {
      const { key, order } = event[0]
      sortBy.value = key
      sortDesc.value = order === 'desc'
      usersListStore.setSorting(key, order === 'desc')
    }
  }
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'success'
      case 'disabled': return 'error'
      case 'suspended': return 'warning'
      default: return 'grey'
    }
  }
  
  const editUser = (user: User) => {
  adminStore.setActiveUserSubModule('SubModuleUserEditor')
  // Возможно здесь также нужно сохранить ID пользователя для редактирования
  // в зависимости от логики вашего приложения
}
  
  // Отслеживание изменений пагинации
  watch([page, itemsPerPage], ([newPage, newItemsPerPage]: [number, number]) => {
    usersListStore.setPagination(newPage, newItemsPerPage)
  })
  
  // Инициализация
  onMounted(() => {
    usersListStore.fetchUsers()
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