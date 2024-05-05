<template>
    <div class="modal">
      <h4>Смена пароля</h4>
      <p>Ваш новый пароль должен отличаться от текущего и прошлых паролей.</p>
      <form @submit.prevent="changePassword">
        <div class="form-group">
          <label for="password">Новый пароль</label>
          <input
            id="password"
            type="password"
            v-model="password"
            :class="{'is-invalid': passwordError}"
          />
          <span v-if="passwordError" class="error-message">{{ passwordError }}</span>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Подтвердите пароль</label>
          <input
            id="confirmPassword"
            type="password"
            v-model="confirmPassword"
            :class="{'is-invalid': confirmPasswordError}"
          />
          <span v-if="confirmPasswordError" class="error-message">{{ confirmPasswordError }}</span>
        </div>
        <button type="submit">Сменить пароль</button>
      </form>
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

        // Опционально: Обработка успешного ответа от сервера
        //alert('Пароль успешно изменен.');
      } catch (error) {
        console.error('Ошибка при смене пароля:', error);
        // Опционально: Обработка ошибки
        //alert('Ошибка при смене пароля.');
      }
    },
  },
};
</script>
  
<style>

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw; /* используем viewport width для ширины */
  height: 100vh; /* используем viewport height для высоты */
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050; 
}

.modal {
  position: relative;
  background-color: white; /* уточняем цвет фона */
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  width: auto; /* позволяем модальному окну адаптироваться к содержимому */
  max-width: 600px; /* ограничиваем максимальную ширину */
  z-index: 1051; /* убеждаемся, что модальное окно выше фона */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  margin-top: 20px;
}

.modal-close {
  cursor: pointer;
  font-size: 24px;
}
</style>