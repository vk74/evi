<!--
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
-->
<template>
  <v-card flat>
    <v-app-bar flat class="px-4 d-flex justify-space-between">
      <div>
        <v-btn
          color="teal"
          variant="outlined"
          @click="createUser"
          class="mr-2"
        >
          создать учетную запись
        </v-btn>
      </div>
      <v-app-bar-title class="text-subtitle-2 text-lowercase text-right">
        список пользователей
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
      <!-- Шаблон для ID -->
      <template v-slot:item.user_id="{ item }">
        <span>{{ item.user_id }}</span>
      </template>

      <!-- Шаблон для статуса пользователя -->
      <template v-slot:item.account_status="{ item }">
        <v-chip
          size="x-small"
        >
          {{ item.account_status }}
        </v-chip>
      </template>

      <!-- Шаблон для колонки "сотрудник" -->
      <template v-slot:item.is_staff="{ item }">
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
import { useStoreViewAllUsers } from './state.view.all.users'

/**
 * Интерфейс заголовка таблицы
 */
interface TableHeader {
  title: string
  key: string
  width?: string
}

// Инициализация хранилища
const usersStore = useStoreViewAllUsers()

// Параметры таблицы
const page = ref<number>(usersStore.page)
const itemsPerPage = ref<number>(usersStore.itemsPerPage)

// Определение колонок таблицы
const headers: TableHeader[] = [
  { title: 'ID', key: 'user_id', width: '80px' },
  { title: 'уч. запись', key: 'username' },
  { title: 'e-mail', key: 'email' },
  { title: 'сотрудник', key: 'is_staff', width: '60px' },
  { title: 'статус', key: 'account_status', width: '60px' },
  { title: 'фамилия', key: 'last_name' },
  { title: 'имя', key: 'first_name' },
  { title: 'отчество', key: 'middle_name' }
]

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
.users-table {
  width: 100%;
}
</style>