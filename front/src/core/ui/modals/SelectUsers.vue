<!-- SelectUsers.vue -->
<!-- Modal component for selecting one or multiple users -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUiStore } from '@/core/state/uistate'
import findUsers from './service.find.users'

// Состояние для выбранных пользователей (UUID)
const selectedUserIds = ref<string[]>([])
const isLoading = ref(false)
const uiStore = useUiStore()
const searchQuery = ref('') // Состояние для поискового запроса
const searchMode = ref<'username' | 'uuid'>('username') // Переключатель режима поиска

// Эмит событий для передачи данных обратно и закрытия
const emit = defineEmits(['select', 'close'])

// Закрытие модального окна
const closeModal = () => {
  console.log('Closing SelectUsers modal')
  emit('close')
}

// Обработка выбора пользователей и возврата UUID
const handleSelectUsers = () => {
  console.log('Selecting users with IDs:', selectedUserIds.value)
  if (selectedUserIds.value.length === 0) {
    uiStore.showErrorSnackbar('Выберите хотя бы одного пользователя')
    return
  }

  try {
    isLoading.value = true
    emit('select', selectedUserIds.value) // Возвращаем массив UUID в вызывающий компонент
    closeModal()
  } catch (error) {
    console.error('Error selecting users:', error)
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Ошибка выбора пользователей')
  } finally {
    isLoading.value = false
  }
}

// Обработчик выбора пользователя
const onUserSelect = (userId: string) => {
  console.log('User selected:', userId)
  if (selectedUserIds.value.includes(userId)) {
    selectedUserIds.value = selectedUserIds.value.filter(id => id !== userId)
  } else {
    selectedUserIds.value.push(userId)
  }
}

// Фильтрация пользователей по поисковому запросу
const filteredUsers = computed(() => {
  const query = searchQuery.value ? searchQuery.value.toLowerCase() : ''
  if (!query) return []
  return [].filter(user => {
    if (searchMode.value === 'username') {
      return (user.username || '').toLowerCase().includes(query)
    } else {
      return (user.user_id || '').toLowerCase().includes(query)
    }
  })
})

// Проверка валидности поисковой строки
const searchRules = [
  (v: string) => !!v || 'Поле не может быть пустым',
  (v: string) => (v?.length >= 2 && v?.length <= 50) || 'Длина должна быть от 2 до 50 символов',
  (v: string) => /^[a-zA-Z0-9]+$/.test(v || '') || 'Допустимы только латинские буквы и цифры, без знаков препинания и кириллицы'
]

// Хэндлер для поиска
const handleSearch = async () => {
  const query = searchQuery.value ? searchQuery.value.trim() : ''
  if (!isSearchValid.value) {
    uiStore.showErrorSnackbar('Строка поиска не соответствует требованиям')
    return
  }

  console.log('Sending query to search service:', query)
  try {
    await findUsers(query)
  } catch (error) {
    console.error('Error searching users:', error)
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Ошибка поиска пользователей')
  }
}

// Проверка валидности поисковой строки для активации поиска
const isSearchValid = computed(() => {
  const query = searchQuery.value ? searchQuery.value.trim() : ''
  return searchRules.every(rule => {
    const result = rule(query)
    return result === true || typeof result !== 'string'
  })
})

// Обработчик нажатия клавиш в поле поиска
const onKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && isSearchValid.value) {
    handleSearch()
  }
}
</script>

<template>
  <v-card>
    <v-card-text>
      <v-row class="mb-4" align="center">
        <v-col cols="12">
          <v-radio-group v-model="searchMode" inline>
            <v-radio label="имя пользователя" value="username"></v-radio>
            <v-radio label="uuid" value="uuid"></v-radio>
          </v-radio-group>
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-model="searchQuery"
            label="поиск"
            variant="outlined"
            density="comfortable"
            append-inner-icon="mdi-magnify"
            clearable
            class="mb-4"
            :rules="searchRules"
            @keypress="onKeyPress"
            @click:append-inner="handleSearch"
          />
        </v-col>
      </v-row>
      <v-list>
        <v-list-item v-for="user in filteredUsers" :key="user.user_id" @click="onUserSelect(user.user_id)">
          <template v-slot:prepend>
            <v-checkbox
              v-model="selectedUserIds"
              :value="user.user_id"
              hide-details
            />
          </template>
          <v-list-item-title>{{ user.username || user.user_id }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="!filteredUsers.length" disabled>
          учетные записи пользователей не выбраны
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        color="gray"
        variant="outlined"
        @click="closeModal"
      >
        Отмена
      </v-btn>
      <v-btn
        color="teal"
        variant="outlined"
        @click="handleSelectUsers"
        :disabled="selectedUserIds.length === 0"
      >
        Добавить
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
</style>