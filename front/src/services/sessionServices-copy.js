// src/services/sessionServices.js
import { useUserStore } from '../state/userstate';
import axios from 'axios';

let sessionTimeout = null;
let warningTimeout = null;

const startSessionTimers = () => {
  const userStore = useUserStore();

  const warningTime = 5 * 60 * 1000; // 5 минут до истечения
  const sessionDuration = (userStore.tokenExpires * 1000) - Date.now();

  clearTimeout(sessionTimeout);
  clearTimeout(warningTimeout);

  warningTimeout = setTimeout(() => {
    // Показать предупреждение пользователю о необходимости продления сессии
    alert('Your session will expire in 5 minutes. Please extend your session.');
  }, sessionDuration - warningTime);

  sessionTimeout = setTimeout(async () => {
    // Попытаться обновить JWT
    try {
      const response = await axios.post('http://localhost:3000/extendtoken', {}, {
        headers: {
          Authorization: `Bearer ${userStore.jwt}`,
        },
      });

      if (response.data.success) {
        userStore.setJwt(response.data.token);
        startSessionTimers(); // Перезапустить таймеры с новыми данными
      } else {
        // Если не удалось обновить токен, выполнить logout
        userStore.logout();
        alert('Your session has expired. Please log in again.');
      }
    } catch (error) {
      console.error('Error extending session:', error);
      userStore.logout();
      alert('Your session has expired. Please log in again.');
    }
  }, sessionDuration);
};

const resetSessionTimers = () => {
  startSessionTimers();
};

export { startSessionTimers, resetSessionTimers };