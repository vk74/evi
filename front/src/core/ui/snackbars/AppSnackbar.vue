/* 
* AppSnackbar.vue 
* Version: 1.1.0
* Кор компонент, обертка над v-snackbar из Vuetify
* Uses Phosphor icons directly instead of MDI
*/

<template>
  <v-snackbar
    v-model="isVisible"
    :color="snackbarColor"
    :timeout="currentTimeout"
    :location="currentPosition"
  >
    <!-- Иконка и текст -->
    <div class="d-flex align-center">
      <component 
        :is="currentIcon"
        :size="20"
        class="mr-2"
      />
      {{ message }}
    </div>
  
    <!-- Кнопка закрытия -->
    <template
      v-if="closable"
      #actions
    >
      <v-btn
        :icon="undefined"
        variant="text"
        size="small"
        @click="close"
      >
        <PhX :size="18" />
      </v-btn>
    </template>
  </v-snackbar>
</template>
  
  <script setup lang="ts">
  import { ref, computed, type Component } from 'vue'
  import { PhCheckCircle, PhWarningCircle, PhWarning, PhInfo, PhX } from '@phosphor-icons/vue'
  import { SnackbarTypeValue } from './types'
  import { SNACKBAR_DEFAULTS } from './constants'
  
  interface Props {
    // Тип уведомления
    type: SnackbarTypeValue;
    // Текст сообщения
    message: string;
    // Время показа
    timeout?: number;
    // Можно ли закрыть
    closable?: boolean;
    // Позиция
    position?: string;
  }
  
  // Пропсы
  const props = withDefaults(defineProps<Props>(), {
    timeout: SNACKBAR_DEFAULTS.TIMEOUT,
    closable: SNACKBAR_DEFAULTS.CLOSABLE,
    position: SNACKBAR_DEFAULTS.POSITION
  })
  
  // События
  const emit = defineEmits<{
    close: []
  }>()
  
  // Состояние
  const isVisible = ref<boolean>(true)
  
  // Icon mapping - returns Phosphor component based on type
  const iconMap: Record<SnackbarTypeValue, Component> = {
    success: PhCheckCircle,
    error: PhWarningCircle,
    warning: PhWarning,
    info: PhInfo
  }
  
  // Вычисляемые свойства
  const snackbarColor = computed(() => SNACKBAR_DEFAULTS.COLORS[props.type])
  const currentIcon = computed<Component>(() => iconMap[props.type])
  const currentTimeout = computed(() => props.timeout)
  const currentPosition = computed(() => props.position as any)
  
  // Методы
  const close = (): void => {
    isVisible.value = false
    emit('close')
  }
  </script>
  
  <style scoped>
  .v-snackbar__wrapper {
    min-width: 300px;
  }
  </style>