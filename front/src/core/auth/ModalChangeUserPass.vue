// ModalChangeUserPass.vue.vue
<template>
  <div class="modal-overlay">
    <div class="modal">
      <v-card>
        <v-card-title class="text-h5">
          смена пароля
        </v-card-title>
        <v-card-text>
          <v-form @submit.prevent="changePassword">
            <v-text-field
              id="currentPassword"
              v-model="currentPassword"
              label="текущий пароль"
              type="password"
              :error-messages="currentPasswordError ? [currentPasswordError] : []"
              outlined
            />
            <v-text-field
              id="password"
              v-model="password"
              label="новый пароль"
              type="password"
              :error-messages="passwordError ? [passwordError] : []"
              outlined
            />
            <v-text-field
              id="confirmPassword"
              v-model="confirmPassword"
              label="подтвердите пароль"
              type="password"
              :error-messages="confirmPasswordError ? [confirmPasswordError] : []"
              outlined
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="teal darken-1"
            text
            @click="changePassword"
          >
            Изменить пароль
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useUserAuthStore } from '@/modules/account/state.user.auth';
import { useUiStore } from '../../core/state/uistate';

interface ChangePasswordRequest {
  username: string;
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
  error?: string;
}

interface Props {
  onClose: () => void;
}

// Props
const props = defineProps<Props>();

// Store initialization
const userStore = useUserAuthStore();
const uiStore = useUiStore();

// Computed
const username = computed(() => userStore.username);

// Refs
const currentPassword = ref<string>('');
const password = ref<string>('');
const confirmPassword = ref<string>('');
const currentPasswordError = ref<string>('');
const passwordError = ref<string>('');
const confirmPasswordError = ref<string>('');

// Watchers
watch(password, (newVal: string) => {
  validatePassword(newVal);
});

watch(confirmPassword, () => {
  confirmPasswordError.value = '';
});

// Validation
const validatePassword = (password: string): void => {
  const regex = /^[a-zA-Zа-яА-Я0-9\p{P}]+$/u;
  passwordError.value = '';

  if (!regex.test(password)) {
    passwordError.value = 'Пароль должен содержать только буквы, цифры и знаки препинания';
    uiStore.showWarningSnackbar('Пароль должен содержать только буквы, цифры и знаки препинания');
  }
};

// Change password handler
const changePassword = async (): Promise<void> => {
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
    const requestData: ChangePasswordRequest = {
      username: username.value,
      currentPassword: currentPassword.value,
      newPassword: password.value,
    };

    const response = await fetch('http://localhost:3000/changeuserpass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Ошибка HTTP: ${response.status}`);
    }

    const result: ChangePasswordResponse = await response.json();
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