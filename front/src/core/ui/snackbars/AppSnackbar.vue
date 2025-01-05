// Кор компонент, обертка над v-snackbar из Vuetify

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
  
  <script setup>
  import { ref, computed } from 'vue'
  import { SnackbarType } from './types'
  import { SNACKBAR_DEFAULTS } from './constants'
  
  // Пропсы
  const props = defineProps({
    // Тип уведомления
    type: {
      type: String,
      required: true,
      validator: (value) => Object.values(SnackbarType).includes(value)
    },
    // Текст сообщения
    message: {
      type: String,
      required: true
    },
    // Время показа
    timeout: {
      type: Number,
      default: SNACKBAR_DEFAULTS.TIMEOUT
    },
    // Можно ли закрыть
    closable: {
      type: Boolean,
      default: SNACKBAR_DEFAULTS.CLOSABLE
    },
    // Позиция
    position: {
      type: String,
      default: SNACKBAR_DEFAULTS.POSITION
    }
  })
  
  // События
  const emit = defineEmits(['close'])
  
  // Состояние
  const isVisible = ref(true)
  
  // Вычисляемые свойства
  const snackbarColor = computed(() => SNACKBAR_DEFAULTS.COLORS[props.type])
  const currentIcon = computed(() => SNACKBAR_DEFAULTS.ICONS[props.type])
  const currentTimeout = computed(() => props.timeout)
  const currentPosition = computed(() => props.position)
  
  // Методы
  const close = () => {
    isVisible.value = false
    emit('close')
  }
  </script>
  
  <style scoped>
  .v-snackbar__wrapper {
    min-width: 300px;
  }
  </style>