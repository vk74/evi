// ModuleLogin.vue - User login component that handles authentication process,
// JWT token processing and user state management
<template>
  <div class="pt-3 pl-3"> 
    <v-card max-width="500px">
      <v-card-title class="text-h5">вход в приложение</v-card-title>
      <v-card-text>
        <v-form>
          <v-text-field v-model="username" label="логин" ref="loginInput" required></v-text-field>
          <v-text-field v-model="password" label="пароль" type="password" required></v-text-field>
        </v-form>
        <p v-if="showError">неправильное имя пользователя либо пароль</p>
        <p v-if="showSuccess">успешно</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="teal darken-1" text @click="login">войти</v-btn>
      </v-card-actions>
      <div class="divider"></div>
      <p class="register-text">если у вас нет учетной записи ev2, <a href="#" @click.prevent="goToRegistration" class="register-link">зарегистрируйтесь</a></p><br>
    </v-card>
  </div>  
</template>

<script>
import { jwtDecode } from 'jwt-decode';  // библиотека для декодирования JWT
import { useUserStore } from '@/core/state/userstate'; // импорт Pinia store
import { startSessionTimers } from '@/core/services/sessionServices'; // импорт функции управления сессией

export default {
  name: 'ModuleLogin',
  data() {
    return {
      username: '',
      password: '',
      showError: false,
      showSuccess: false
    };
  },
  methods: {
    async login() {
      console.log("Login:", this.username, "Pass:", this.password);
      this.showError = false; // сбрасываем ошибку при каждой новой попытке входа
      this.showSuccess = false; // сбрасываем сообщение об успехе при каждой новой попытке
      try {
        const response = await this.$http.post('http://localhost:3000/login', {
          username: this.username,
          password: this.password
        });
        console.log('reply from backend server:', response);
        if (response.data.success) {
          localStorage.setItem('userToken', response.data.token); // сохраняем токен в localStorage чтобы пользователю не пришлось повторно аутентифицироваться
          const decoded = jwtDecode(response.data.token);  // декодирование JWT для извлечения данных пейлоуда
          console.log('decoded JWT:', decoded);
          // обновление Pinia хранилища данными из пейлоуда токена
          const userStore = useUserStore();
          userStore.setUsername(decoded.sub); // установка имени пользователя
          userStore.setUserID(decoded.uid); // установка UUID пользователя
          userStore.setLoggedIn(true); // установка флага аутентификации в true
          userStore.setJwt(response.data.token); // сохраняем сам токен
          // обновляем остальные поля на основе декодированного токена
          userStore.setIssuer(decoded.iss);
          userStore.setAudience(decoded.aud);
          userStore.setIssuedAt(decoded.iat);
          userStore.setJwtId(decoded.jti);
          userStore.setTokenExpires(decoded.exp); // срок истечения жизни токена
          
          console.log('User logged in successfully');
          startSessionTimers();

          this.showSuccess = true;
          this.showError = false;
          setTimeout(() => {
            this.closeDialog();
          }, 1000);
          userStore.setActiveModule('Catalog');
        } else {
          this.showError = true; // показываем ошибку, если валидация неудачна
        }
      } catch (error) {
        this.showError = true; // показываем ошибку, если возникла ошибка запроса
        console.error('Error sending request:', error);
      }
    },
    closeDialog() {
      this.dialog = false; // закрыть модальное окно
      this.$emit('close'); // оповестить родительский компонент о закрытии
    },
    goToRegistration() {
      const userStore = useUserStore();
      userStore.setActiveModule('NewUserRegistration');
    }
  }
};
</script>

<style scoped>
.divider {
  width: calc(100% - 32px); /* ширина такая же как у полей логина и пароля */
  height: 1px;
  background-color: #ccc;
  margin: 16px auto; /* отступы сверху и снизу */
}

.register-text {
  text-align: center;
  margin-top: 16px;
}

.register-link {
  color: teal;
  text-decoration: none;
}

.register-link:hover {
  text-decoration: underline;
}
</style>