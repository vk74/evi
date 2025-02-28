<!-- SelectUsers.vue -->
<!-- Modal component for selecting one or multiple users -->
<script setup lang="ts">
import { ref } from 'vue'
import { useUiStore } from '@/core/state/uistate'

// Состояние для выбранных пользователей (UUID)
const selectedUserIds = ref<string[]>([])
const isLoading = ref(false)
const uiStore = useUiStore()

// Эмит событий для передачи данных обратно и закрытия
const emit = defineEmits(['select', 'close'])

// Закрытие модального окна
const closeModal = () => {
  emit('close')
}

// Обработка выбора пользователей и возврата UUID
const handleSelectUsers = () => {
  if (selectedUserIds.value.length === 0) {
    uiStore.showErrorSnackbar('Выберите хотя бы одного пользователя')
    return
  }

  try {
    isLoading.value = true
    emit('select', selectedUserIds.value) // Возвращаем массив UUID в вызывающий компонент
    closeModal()
  } catch (error) {
    uiStore.showErrorSnackbar(error instanceof Error ? error.message : 'Ошибка выбора пользователей')
  } finally {
    isLoading.value = false
  }
}

// Обработчик выбора пользователя (пример, можно адаптировать под реальные данные)
const onUserSelect = (userId: string) => {
  if (selectedUserIds.value.includes(userId)) {
    selectedUserIds.value = selectedUserIds.value.filter(id => id !== userId)
  } else {
    selectedUserIds.value.push(userId)
  }
}
</script>

<template>
  <v-card>
    <v-card-title>Выбрать участников</v-card-title>
    <v-card-text>
      <!-- Пример списка пользователей (нужно адаптировать под реальные данные) -->
      <v-list>
        <v-list-item v-for="user in []" :key="user.user_id" @click="onUserSelect(user.user_id)">
          <template v-slot:prepend>
            <v-checkbox
              v-model="selectedUserIds"
              :value="user.user_id"
              hide-details
            />
          </template>
          <v-list-item-title>{{ user.username || user.user_id }}</v-list-item-title>
        </v-list-item>
        <v-list-item v-if="![]" disabled>
          Нет доступных пользователей
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
        :loading="isLoading"
      >
        Добавить
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
</style>