<template>
    <div class="modal-overlay">
      <div class="modal">
        <v-card>
          <v-card-title class="text-h5">cмена пароля</v-card-title>
          <v-card-text>
          <!--<p>Ваш новый пароль должен отличаться от текущего и прошлых паролей.</p>
          <br> -->
          <v-form @submit.prevent="changePassword">
              <v-text-field
                label="Новый пароль"
                id="password"
                type="password"
                v-model="password"
                :error-messages="passwordError ? [passwordError] : []"
                outlined
                >
              </v-text-field>
              <v-text-field
                label="Подтвердите пароль"
                id="confirmPassword"
                type="password"
                v-model="confirmPassword"
                :error-messages="confirmPasswordError ? [confirmPasswordError] : []"
                outlined
                >
            </v-text-field>
          </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
              <v-btn color="teal darken-1" text @click="changePassword">изменить пароль</v-btn>
              <!-- <v-btn type="submit" color="primary">сменить пароль</v-btn> -->
          </v-card-actions>
        </v-card>
      </div>
    </div>
  </template>
  
  <script>
  import { useStore } from 'vuex'; // импортируем хук useStore из Vuex
  
  export default {
  name: 'ModalChangeUserPass',
  setup() {
      const store = useStore(); // используем хук useStore для доступа к хранилищу
      const username = store.state.username; // получаем username из состояния
      return { username }; // возвращаем username для использования в шаблоне/методах
    },
    data() {
      return {
        password: '',
        confirmPassword: '',
        passwordError: '',
        confirmPasswordError: '',
      };
    },
  watch: {
      // наблюдатель за изменением пароля для валидации
      password(newVal) {
      this.validatePassword(newVal);
      },
      // наблюдатель за изменением подтверждения пароля для проверки совпадения
      confirmPassword() {
      this.confirmPasswordError = '';
      },
  },
  methods: {
      validatePassword(password) {
      const regex = /^[a-zA-Zа-яА-Я0-9\p{P}]{8,40}$/u;
      this.passwordError = '';
  
      if (!regex.test(password)) {
          this.passwordError = 'Пароль должен быть от 8 до 40 символов и содержать только буквы, цифры и знаки препинания';
      }
      },
  
      async changePassword() {
        if (this.password !== this.confirmPassword) {
          this.confirmPasswordError = 'Пароли не совпадают';
          return;
        }
  
        try {
          const response = await fetch('http://localhost:3000/changeuserpass', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: this.username, // используем username из vuex
              newPassword: this.password,
            }),
          });
  
          if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
          }
  
          const result = await response.json();
          console.log('Результат смены пароля:', result);
  
          // опционально: обработка успешного ответа от сервера
          //alert('пароль успешно изменен.');
        } catch (error) {
          console.error('Ошибка при смене пароля:', error);
          // опционально: обработка ошибки
          //alert('ошибка при смене пароля.');
        }
      },
    },
  };
  </script>
    
  <style>
  
  </style>