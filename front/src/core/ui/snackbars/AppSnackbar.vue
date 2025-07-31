/* 
* AppSnackbar.vue 
* Кор компонент, обертка над v-snackbar из Vuetify
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
      <v-icon
        :icon="currentIcon"
        class="mr-2"
        size="small"
      />
      {{ message }}
    </div>
  
    <!-- Кнопка закрытия -->
    <template
      v-if="closable"
      #actions
    >
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        @click="close"
      />
    </template>
  </v-snackbar>
</template>
  
  <script setup lang="ts">
  import { ref, computed } from 'vue'
  import { SnackbarType } from './types'
  import { SNACKBAR_DEFAULTS } from './constants'
  
  interface Props {
    // Тип уведомления
    type: SnackbarType;
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
  
  // Вычисляемые свойства
  const snackbarColor = computed(() => SNACKBAR_DEFAULTS.COLORS[props.type])
  const currentIcon = computed(() => SNACKBAR_DEFAULTS.ICONS[props.type])
  const currentTimeout = computed(() => props.timeout)
  const currentPosition = computed(() => props.position)
  
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