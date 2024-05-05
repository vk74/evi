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
        <!-- <v-btn color="teal darken-1" text @click="closeDialog">отмена</v-btn> -->
        <v-btn color="teal darken-1" text @click="login">войти</v-btn>
      </v-card-actions>
    </v-card>
  </div>  
</template>

<script>
  import { jwtDecode } from 'jwt-decode';  // библиотека для декодирования JWT
  
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
      focusLoginInput() {  
        if (this.$refs.loginInput && typeof this.$refs.loginInput.focus === 'function') { // проверяем, существует ли элемент и доступен ли метод focus
          this.$refs.loginInput.focus();
        }
      },
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
  
            // обновление Vuex хранилища данными из пейлоуда токена
            this.$store.commit('setUsername', decoded.sub); // мутация для установки имени пользователя
            this.$store.commit('setLoggedIn', true); // мутация для установки флага аутентификации в true
            this.$store.commit('setJwt', response.data.token); // сохраняем сам токен
            // обновляем остальные поля на основе декодированного токена
            this.$store.commit('setIssuer', decoded.iss);
            this.$store.commit('setAudience', decoded.aud);
            this.$store.commit('setIssuedAt', decoded.iat);
            this.$store.commit('setJwtId', decoded.jti);
            this.$store.commit('setTokenExpires', decoded.exp); // срок истечения жизни токена
  
            this.showSuccess = true;
            setTimeout(() => {
              this.$store.commit('setActiveModule', 'Work'); // устанавливаем активный модуль на 'Work'
            }, 1000);

          } else {
            this.showError = true; // показываем ошибку, если валидация неудачна
          }
        } catch (error) {
          this.showError = true; // показываем ошибку, если возникла ошибка запроса
          console.error('Ошибка при отправке запроса:', error);
        }
      },
    },
    mounted() {
        this.focusLoginInput();
    },
  };
</script>

<style>

</style>