<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <div class="modal-header">
        <h4>Регистрация</h4>
        <span class="modal-close" @click="closeModal">&times;</span>
      </div>
      <form class="modal-body" @submit.prevent="submitForm">
        <div class="form-group">
          <label for="username">Имя пользователя</label>
          <input type="text" id="username" v-model="user.username" required>
          <span v-if="isInvalid('username')" class="user-registration-form-info">Имя пользователя должно быть не более 25 символов и содержать только буквы и цифры.</span>
        </div>
        <div class="form-group">
          <label for="password">Пароль</label>
          <input type="password" id="password" v-model="user.password" required>
          <span v-if="isInvalid('password')" class="user-registration-form-info">Пароль должен быть от 8 до 40 символов и содержать только буквы, цифры и знаки препинания.</span>
        </div>
        <div class="form-group">
          <label for="surname">Фамилия</label>
          <input type="text" id="surname" v-model="user.surname" required>
          <span v-if="isInvalid('surname')" class="user-registration-form-info">Фамилия должна быть не более 25 символов и содержать только буквы.</span>
        </div>
        <div class="form-group">
          <label for="name">Имя</label>
          <input type="text" id="name" v-model="user.name" required>
          <span v-if="isInvalid('name')" class="user-registration-form-info">Имя должно быть не более 25 символов и содержать только буквы.</span>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="user.email" required>
          <span v-if="isInvalid('email')" class="user-registration-form-info">Введите корректный адрес электронной почты.</span>
        </div>
        <div class="form-group">
          <label for="phone">Телефон</label>
          <input type="text" id="phone" v-model="user.phone">
          <span v-if="isInvalid('phone')" class="user-registration-form-info">Телефон должен содержать только цифры и быть не длиннее 12 символов.</span>
        </div>
        <div class="form-group">
          <label for="address">Адрес</label>
          <input type="text" id="address" v-model="user.address">
          <span v-if="isInvalid('address')" class="user-registration-form-info">Адрес должен быть не более 50 символов и содержать только буквы, цифры и знаки препинания.</span>
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalRegister',
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
      }
    };
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    async submitForm() {
      const invalidFields = this.validateForm();
      if (invalidFields.length === 0) {
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
            this.closeModal();
          } else {
            console.error('Ошибка отправки регистрационных данных на сервер:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Ошибка отправки регистрационных данных на сервер:', error);
        }
      } else {
        console.error('Ошибка валидации: невалидные поля -', invalidFields.join(', '));
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
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  width: 400px; /* Увеличиваем ширину модального окна */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-close {
  cursor: pointer;
  font-size: 24px;
}

.form-group {
  margin-bottom: 10px;
}

.form-group label {
  display: block;
}

.form-group input {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}
</style>
