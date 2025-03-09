// ModalChangeUserPass.vue.vue
<template>
  <div class="modal-overlay">
    <div class="modal">
      <v-card>
        <v-card-title class="text-h5">смена пароля</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="changePassword">
            <v-text-field
              label="текущий пароль"
              id="currentPassword"
              type="password"
              v-model="currentPassword"
              :error-messages="currentPasswordError ? [currentPasswordError] : []"
              outlined
            ></v-text-field>
            <v-text-field
              label="новый пароль"
              id="password"
              type="password"
              v-model="password"
              :error-messages="passwordError ? [passwordError] : []"
              outlined
            ></v-text-field>
            <v-text-field
              label="подтвердите пароль"
              id="confirmPassword"
              type="password"
              v-model="confirmPassword"
              :error-messages="confirmPasswordError ? [confirmPasswordError] : []"
              outlined
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="teal darken-1" text @click="changePassword">Изменить пароль</v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useUserStore } from '@/core/state/userstate';
import { useUiStore } from '../../core/state/uistate';

// Props
const props = defineProps({
  onClose: {
    type: Function,
    required: true,
  },
});

// Store initialization
const userStore = useUserStore();
const uiStore = useUiStore();

// Computed
const username = computed(() => userStore.username);

// Refs
const currentPassword = ref('');
const password = ref('');
const confirmPassword = ref('');
const currentPasswordError = ref('');
const passwordError = ref('');
const confirmPasswordError = ref('');

// Watchers
watch(password, (newVal) => {
  validatePassword(newVal);
});

watch(confirmPassword, () => {
  confirmPasswordError.value = '';
});

// Validation
const validatePassword = (password) => {
  const regex = /^[a-zA-Zа-яА-Я0-9\p{P}]+$/u;
  passwordError.value = '';

  if (!regex.test(password)) {
    passwordError.value = 'Пароль должен содержать только буквы, цифры и знаки препинания';
    uiStore.showWarningSnackbar('Пароль должен содержать только буквы, цифры и знаки препинания');
  }
};

// Change password handler
const changePassword = async () => {
  // Validation checks
  if (password.value.length < 8 || password.value.length > 40) {
    passwordError.value = 'Длина пароля должна быть от 8 до 40 символов.';
    uiStore.showWarningSnackbar('Длина пароля должна быть от 8 до 40 символов');
    return;
  }

  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Пароли не совпадают';
    uiStore.showWarningSnackbar('Введенные пароли не совпадают');
    return;
  }

  if (!currentPassword.value) {
    currentPasswordError.value = 'Текущий пароль обязателен.';
    uiStore.showWarningSnackbar('Введите текущий пароль');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/changeuserpass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        currentPassword: currentPassword.value,
        newPassword: password.value,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const result = await response.json();
    console.log('Результат смены пароля:', result);

    if (result.success) {
      uiStore.showSuccessSnackbar('Пароль успешно изменен');
      setTimeout(() => {
        props.onClose();
      }, 3000);
    } else {
      uiStore.showErrorSnackbar(result.error || 'Ошибка при смене пароля');
    }
  } catch (error) {
    console.error('Ошибка при смене пароля:', error);
    uiStore.showErrorSnackbar('Произошла ошибка при смене пароля');
  }
};
</script>

<style>
/* ваши стили */
</style>