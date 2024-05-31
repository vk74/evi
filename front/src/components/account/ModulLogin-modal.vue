<template>
  <div class="modal-overlay" v-if="dialog" @click.self="closeModal">
    <v-card>
      <v-card-title class="text-h5">вход в приложение</v-card-title>
      <v-card-text>
        <v-form>
          <v-text-field v-model="username" label="логин" required></v-text-field>
          <v-text-field v-model="password" label="пароль" type="password" required></v-text-field>
        </v-form>
        <p v-if="showError">неправильное имя пользователя либо пароль</p>
        <p v-if="showSuccess">успешно</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="teal darken-1" text @click="login">войти</v-btn>
      </v-card-actions>
    </v-card>
  </div>  
</template>

<script>
import { jwtDecode } from 'jwt-decode'; // импорт функции декодирования JWT
import { useUserStore } from '../../state/userstate'; // импорт Pinia store

export default {
  name: 'ModulLogin-modal',
  data() {
    return {
      dialog: true, // Сделаем диалог открытым по умолчанию
      username: '',
      password: '',
      showError: false,
      showSuccess: false
    };
  },
  methods: {
    async login() {
      console.log("Логин:", this.username, "Пароль:", this.password);

      this.showError = false; // сбрасываем ошибку при каждой новой попытке входа
      this.showSuccess = false; // сбрасываем сообщение об успехе при каждой новой попытке

      try {
        const response = await this.$http.post('http://localhost:3000/login', {
          username: this.username,
          password: this.password
        });

        console.log('Ответ сервера:', response);

        if (response.data.success) {
          localStorage.setItem('userToken', response.data.token); // сохраняем токен в localStorage чтобы пользователю не пришлось повторно аутентифицироваться

          const decoded = jwtDecode(response.data.token);  // декодирование JWT для извлечения данных пейлоуда
          console.log('Декодированный JWT:', decoded);

          // обновление Pinia хранилища данными из пейлоуда токена
          const userStore = useUserStore();
          userStore.setUsername(decoded.sub); // установка имени пользователя
          userStore.setLoggedIn(true); // установка флага аутентификации в true
          userStore.setJwt(response.data.token); // сохраняем сам токен
          // обновляем остальные поля на основе декодированного токена
          userStore.setIssuer(decoded.iss);
          userStore.setAudience(decoded.aud);
          userStore.setIssuedAt(decoded.iat);
          userStore.setJwtId(decoded.jti);
          userStore.setTokenExpires(decoded.exp); // срок истечения жизни токена

          this.showSuccess = true;
          this.showError = false;
          setTimeout(() => {
            this.closeDialog();
          }, 1000);
        } else {
          this.showError = true; // показываем ошибку, если валидация неудачна
        }
      } catch (error) {
        this.showError = true; // показываем ошибку, если возникла ошибка запроса
        console.error('Ошибка при отправке запроса:', error);
      }
    },
    closeDialog() {
      this.dialog = false; // закрыть модальное окно
      this.$emit('close'); // оповестить родительский компонент о закрытии
    }
  }
};
</script>

<style>
/* ваши стили */
</style>
