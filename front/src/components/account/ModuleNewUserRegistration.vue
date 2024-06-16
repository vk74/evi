<template>
    <div class="pt-3 pl-3">
      <v-card max-width="500px">
        <v-card-title class="text-h5">Регистрация</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitForm">
            <v-text-field v-model="user.username" label="Имя пользователя" required></v-text-field>
            <span v-if="isInvalid('username')" class="user-registration-form-info">Имя пользователя должно быть не более 25 символов и содержать только буквы и цифры.</span>
  
            <v-text-field v-model="user.password" label="Пароль" type="password" required></v-text-field>
            <span v-if="isInvalid('password')" class="user-registration-form-info">Пароль должен быть от 8 до 40 символов и содержать только буквы, цифры и знаки препинания.</span>
  
            <v-text-field v-model="user.surname" label="Фамилия" required></v-text-field>
            <span v-if="isInvalid('surname')" class="user-registration-form-info">Фамилия должна быть не более 25 символов и содержать только буквы.</span>
  
            <v-text-field v-model="user.name" label="Имя" required></v-text-field>
            <span v-if="isInvalid('name')" class="user-registration-form-info">Имя должно быть не более 25 символов и содержать только буквы.</span>
  
            <v-text-field v-model="user.email" label="Email" required></v-text-field>
            <span v-if="isInvalid('email')" class="user-registration-form-info">Введите корректный адрес электронной почты.</span>
  
            <v-text-field v-model="user.phone" label="Телефон"></v-text-field>
            <span v-if="isInvalid('phone')" class="user-registration-form-info">Телефон должен содержать только цифры и быть не длиннее 12 символов.</span>
  
            <v-text-field v-model="user.address" label="Адрес"></v-text-field>
            <span v-if="isInvalid('address')" class="user-registration-form-info">Адрес должен быть не более 50 символов и содержать только буквы, цифры и знаки препинания.</span>
          </v-form>
          <p v-if="showError">Ошибка валидации: невалидные поля - {{ invalidFields.join(', ') }}</p>
          <p v-if="showSuccess">Регистрация прошла успешно</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="teal darken-1" text @click="submitForm">регистрация</v-btn>
        </v-card-actions>
        <div class="divider"></div>
        <p class="login-text">уже есть учетная запись? <a href="#" @click.prevent="goToLogin" class="login-link">войдите в систему</a></p><br>
      </v-card>
    </div>
  </template>
  
  <script>
  import { useUserStore } from '../../state/userstate';
  
  export default {
    name: 'ModuleNewUserRegistration',
    data() {
      return {
        user: {
          username: '',
          password: '',
          surname: '',
          name: '',
          email: '',
          phone: '',
          address: ''
        },
        showError: false,
        showSuccess: false,
        invalidFields: []
      };
    },
    methods: {
      async submitForm() {
        this.showError = false;
        this.invalidFields = this.validateForm();
        if (this.invalidFields.length === 0) {
          try {
            const response = await fetch('http://localhost:3000/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(this.user)
            });
  
            if (response.ok) {
              console.log('Регистрационные данные пользователя успешно отправлены на сервер');
              const userStore = useUserStore();
              userStore.setUsername(this.user.username);
              userStore.setJwt(''); // Установите JWT, если он возвращается сервером
              userStore.setLoggedIn(true); // Предположим, что пользователь автоматически входит в систему после регистрации
              this.showSuccess = true;
              setTimeout(() => {
                userStore.setActiveModule('Catalog');
              }, 1000);
            } else {
              console.error('Ошибка отправки регистрационных данных на сервер:', response.status, response.statusText);
            }
          } catch (error) {
            console.error('Ошибка отправки регистрационных данных на сервер:', error);
          }
        } else {
          this.showError = true;
        }
      },
      validateForm() {
        const invalidFields = [];
        const usernameRegex = /^[a-zA-Zа-яА-Я0-9]{1,25}$/;
        const passwordRegex = /^[a-zA-Zа-яА-Я0-9\p{P}]{8,40}$/u;
        const nameSurnameRegex = /^[a-zA-Zа-яА-Я]{1,25}$/;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const phoneRegex = /^[0-9]{0,12}$/;
        const addressRegex = /^[a-zA-Zа-яА-Я0-9\p{P}]{1,50}$/u;
  
        if (!usernameRegex.test(this.user.username)) invalidFields.push('Имя пользователя');
        if (!passwordRegex.test(this.user.password)) invalidFields.push('Пароль');
        if (!nameSurnameRegex.test(this.user.surname)) invalidFields.push('Фамилия');
        if (!nameSurnameRegex.test(this.user.name)) invalidFields.push('Имя');
        if (!emailRegex.test(this.user.email)) invalidFields.push('Email');
        if (!phoneRegex.test(this.user.phone)) invalidFields.push('Телефон');
        if (!addressRegex.test(this.user.address)) invalidFields.push('Адрес');
  
        return invalidFields;
      },
      isInvalid(field) {
        switch(field) {
          case 'username':
            return this.user.username && !/^[a-zA-Zа-яА-Я0-9]{1,25}$/.test(this.user.username);
          case 'password':
            return this.user.password && !/^[a-zA-Zа-яА-Я0-9\p{P}]{8,40}$/u.test(this.user.password);
          case 'surname':
          case 'name':
            return this.user[field] && !/^[a-zA-Zа-яА-Я]{1,25}$/.test(this.user[field]);
          case 'email':
            return this.user.email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(this.user.email);
          case 'phone':
            return this.user.phone && !/^[0-9]{0,12}$/.test(this.user.phone);
          case 'address':
            return this.user.address && !/^[a-zA-Zа-яА-Я0-9\p{P}]{1,50}$/u.test(this.user.address);
          default:
            return false;
        }
      },
      goToLogin() {
        const userStore = useUserStore();
        userStore.setActiveModule('Login');
      }
    }
  };
  </script>
  
  <style scoped>
  .user-registration-form-info {
    color: red;
    font-size: 0.8em;
  }
  
  .divider {
    width: calc(100% - 32px); /* ширина такая же как у полей ввода */
    height: 1px;
    background-color: #ccc;
    margin: 16px auto; /* отступы сверху и снизу */
  }
  
  .login-text {
    text-align: center;
    margin-top: 16px;
  }
  
  .login-link {
    color: teal;
    text-decoration: none;
  }
  
  .login-link:hover {
    text-decoration: underline;
  }
  </style>  