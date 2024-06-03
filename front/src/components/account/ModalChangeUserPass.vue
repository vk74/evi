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
      <v-snackbar v-model="showSuccessMessage" :timeout="3000" color="success">
        Пароль успешно изменен.
      </v-snackbar>
      <v-snackbar v-model="showErrorMessage" :timeout="3000" color="error">
        {{ errorMessage }}
      </v-snackbar>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../../state/userstate'; // импорт Pinia store
import { ref, computed, watch } from 'vue';

export default {
  name: 'ModalChangeUserPass',
  props: {
    onClose: {
      type: Function,
      required: true,
    },
  },
  setup(props) {
    const userStore = useUserStore(); // используем хук useUserStore для доступа к хранилищу
    const username = computed(() => userStore.username); // получаем username из состояния
    const currentPassword = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const currentPasswordError = ref('');
    const passwordError = ref('');
    const confirmPasswordError = ref('');
    const showSuccessMessage = ref(false);
    const showErrorMessage = ref(false);
    const errorMessage = ref('');

    // наблюдатель за изменением пароля для валидации
    watch(password, (newVal) => {
      validatePassword(newVal);
    });

    // наблюдатель за изменением подтверждения пароля для проверки совпадения
    watch(confirmPassword, () => {
      confirmPasswordError.value = '';
    });

    const validatePassword = (password) => {
      const regex = /^[a-zA-Zа-яА-Я0-9\p{P}]+$/u;
      passwordError.value = '';

      if (!regex.test(password)) {
        passwordError.value = 'Пароль должен содержать только буквы, цифры и знаки препинания';
      }
    };

    const changePassword = async () => {
      if (password.value.length < 8 || password.value.length > 40) {
        passwordError.value = 'Длина пароля должна быть от 8 до 40 символов.';
        return;
      }

      if (password.value !== confirmPassword.value) {
        confirmPasswordError.value = 'Пароли не совпадают';
        return;
      }

      if (!currentPassword.value) {
        currentPasswordError.value = 'Текущий пароль обязателен.';
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/changeuserpass', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.value, // используем username из Pinia
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
          showSuccessMessage.value = true;
          setTimeout(() => {
            props.onClose(); // вызываем метод для закрытия модального окна
          }, 3000);
        } else {
          showErrorMessage.value = true;
          errorMessage.value = result.error;
        }
      } catch (error) {
        console.error('Ошибка при смене пароля:', error);
        showErrorMessage.value = true;
        errorMessage.value = 'Ошибка при смене пароля.';
      }
    };

    return {
      currentPassword,
      password,
      confirmPassword,
      currentPasswordError,
      passwordError,
      confirmPasswordError,
      changePassword,
      showSuccessMessage,
      showErrorMessage,
      errorMessage,
    };
  },
};
</script>

<style>
/* ваши стили */
</style>