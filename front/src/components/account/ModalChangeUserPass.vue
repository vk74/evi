<template>
  <div class="modal-overlay">
    <div class="modal">
      <v-card>
        <v-card-title class="text-h5">cмена пароля</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="changePassword">
            <v-text-field
              label="Новый пароль"
              id="password"
              type="password"
              v-model="password"
              :error-messages="passwordError ? [passwordError] : []"
              outlined
            ></v-text-field>
            <v-text-field
              label="Подтвердите пароль"
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
          <v-btn color="teal darken-1" text @click="changePassword">изменить пароль</v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script>
import { useUserStore } from '../../state/userstate'; // импорт Pinia store
import { ref, computed, watch } from 'vue';

export default {
  name: 'ModalChangeUserPass',
  setup() {
    const userStore = useUserStore(); // используем хук useUserStore для доступа к хранилищу
    const username = computed(() => userStore.username); // получаем username из состояния
    const password = ref('');
    const confirmPassword = ref('');
    const passwordError = ref('');
    const confirmPasswordError = ref('');

    // наблюдатель за изменением пароля для валидации
    watch(password, (newVal) => {
      validatePassword(newVal);
    });

    // наблюдатель за изменением подтверждения пароля для проверки совпадения
    watch(confirmPassword, () => {
      confirmPasswordError.value = '';
    });

    const validatePassword = (password) => {
      const regex = /^[a-zA-Zа-яА-Я0-9\p{P}]{8,40}$/u;
      passwordError.value = '';

      if (!regex.test(password)) {
        passwordError.value = 'Пароль должен быть от 8 до 40 символов и содержать только буквы, цифры и знаки препинания';
      }
    };

    const changePassword = async () => {
      if (password.value !== confirmPassword.value) {
        confirmPasswordError.value = 'Пароли не совпадают';
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
            newPassword: password.value,
          }),
        });

        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const result = await response.json();
        console.log('Результат смены пароля:', result);

        // опционально: обработка успешного ответа от сервера
        // alert('пароль успешно изменен.');
      } catch (error) {
        console.error('Ошибка при смене пароля:', error);
        // опционально: обработка ошибки
        // alert('ошибка при смене пароля.');
      }
    };

    return {
      password,
      confirmPassword,
      passwordError,
      confirmPasswordError,
      changePassword,
    };
  },
};
</script>

<style>
/* ваши стили */
</style>
