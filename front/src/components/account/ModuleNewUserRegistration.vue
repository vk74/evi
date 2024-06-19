
<template>
  <div class="pt-3 pl-3">
    <v-card max-width="500px">
      <v-card-title class="text-h5">Регистрация</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submitForm">
          <v-text-field v-model="user.username" label="Имя пользователя *" required></v-text-field>
          <span v-if="isInvalid('username')" class="user-registration-form-info">Имя пользователя должно быть не более 25 символов и содержать только буквы и цифры.</span>

          <v-text-field
            v-model="user.password"
            :type="showPassword ? 'text' : 'password'"
            label="Пароль *"
            append-icon="mdi-eye"
            @click:append="togglePasswordVisibility"
            required
          ></v-text-field>
          <span v-if="isInvalid('password')" class="user-registration-form-info">Пароль должен быть от 8 до 40 символов и содержать только буквы, цифры и знаки препинания.</span>

          <v-text-field v-model="user.surname" label="Фамилия *" required></v-text-field>
          <span v-if="isInvalid('surname')" class="user-registration-form-info">Фамилия должна быть не более 25 символов и содержать только буквы.</span>

          <v-text-field v-model="user.name" label="Имя *" required></v-text-field>
          <span v-if="isInvalid('name')" class="user-registration-form-info">Имя должно быть не более 25 символов и содержать только буквы.</span>

          <v-text-field v-model="user.email" label="Email *" required></v-text-field>
          <span v-if="isInvalid('email')" class="user-registration-form-info">Введите корректный адрес электронной почты.</span>

          <v-text-field
            v-model="user.phone"
            label="Телефон"
            placeholder="+7 (###) ###-####"
          ></v-text-field>
          <span v-if="isInvalid('phone')" class="user-registration-form-info">Телефон должен содержать только цифры и быть не длиннее 12 символов.</span>

          <v-text-field v-model="user.address" label="Адрес"></v-text-field>
          <span v-if="isInvalid('address')" class="user-registration-form-info">Адрес должен быть не более 100 символов и содержать только буквы, цифры, пробелы и знаки препинания.</span>
        </v-form>
        <p v-if="showError" class="error-message">Ошибка валидации: невалидные поля - {{ invalidFields.join(', ') }}</p>
        <p v-if="showDuplicateUsernameError" class="error-message">ошибка: такое имя пользователя уже зарегистрировано</p>
        <p v-if="showDuplicateEmailError" class="error-message">ошибка: такой адрес электронной почты уже используется</p>
        <p v-if="showDuplicatePhoneError" class="error-message">ошибка: такой номер телефона уже используется</p>
        <p v-if="showSuccess" class="success-message">Данные регистрационной формы успешно отправлены на сервер. Новый пользователь зарегистрирован!</p>
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
      showDuplicateUsernameError: false,
      showDuplicateEmailError: false,
      showDuplicatePhoneError: false,
      invalidFields: [],
      showPassword: false // состояние для отображения/скрытия пароля
    };
  },
  methods: {
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    async submitForm() {
      this.showError = false;
      this.showDuplicateUsernameError = false;
      this.showDuplicateEmailError = false;
      this.showDuplicatePhoneError = false;
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
            console.log('New user registration data successfully sent to backend server');
            this.showSuccess = true;
          } else {
            const errorData = await response.json();
            if (errorData.message === 'this username is already registered by another user') {
              this.showDuplicateUsernameError = true;
            } else if (errorData.message === 'this e-mail is already registered by another user') {
              this.showDuplicateEmailError = true;
            } else if (errorData.message === 'this phone number is already registered by another user') {
              this.showDuplicatePhoneError = true;
            } else {
              console.error('Error on sending registration data to backend:', response.status, response.statusText);
            }
          }
        } catch (error) {
          console.error('Error on sending registration data to backend:', error);
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
      const emailRegex = /^[a-zA-Zа-яА-Я0-9._%+-]+@[a-zA-Zа-яА-Я0-9.-]+\.[a-zA-Zа-яА-Я]{2,6}$/;
      const phoneRegex = /^[+0-9]{0,15}$/;
      const addressRegex = /^[a-zA-Zа-яА-Я0-9\s\p{P}]{1,100}$/u;

      if (!usernameRegex.test(this.user.username)) invalidFields.push('Имя пользователя');
      if (!passwordRegex.test(this.user.password)) invalidFields.push('Пароль');
      if (!nameSurnameRegex.test(this.user.surname)) invalidFields.push('Фамилия');
      if (!nameSurnameRegex.test(this.user.name)) invalidFields.push('Имя');
      if (!emailRegex.test(this.user.email)) invalidFields.push('Email');
      if (this.user.phone && !phoneRegex.test(this.user.phone)) invalidFields.push('Телефон');
      if (this.user.address && !addressRegex.test(this.user.address)) invalidFields.push('Адрес');

      return invalidFields;
    },
    isInvalid(field) {
      switch(field) {
        case 'username':
          return this.user.username && !/^[a-zA-Zа-яА-Я0-9]{1,25}$/.test(this.user.username);
        case 'password':
          return this.user.password && !/^[a-zA-Zа-яА-Я0-9\p{P}]{8,40}$/u.test(this.user.password);
        case 'surname':
          return this.user.surname && !/^[a-zA-Zа-яА-Я]{1,25}$/.test(this.user.surname);
        case 'name':
          return this.user.name && !/^[a-zA-Zа-яА-Я]{1,25}$/.test(this.user.name);
        case 'email':
          return this.user.email && !/^[a-zA-Zа-яА-Я0-9._%+-]+@[a-zA-Zа-яА-Я0-9.-]+\.[a-zA-Zа-яА-Я]{2,6}$/.test(this.user.email);
        case 'phone':
          return this.user.phone && !/^[+0-9]{0,15}$/.test(this.user.phone);
        case 'address':
          return this.user.address && !/^[a-zA-Zа-яА-Я0-9\s\p{P}]{1,100}$/u.test(this.user.address);
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
  width: calc(100% - 32px); /* divider width same as data fields */
  height: 1px;
  background-color: #ccc;
  margin: 16px auto; 
}

.login-text, .success-message {
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

.error-message {
  color: red; /* Change the color of error message to red */
}
</style>