// src/services/sessionServices.js
import { useUserStore } from '@/core/state/userstate';
import { createApp, h } from 'vue';
import vuetify from '../../plugins/vuetify'; 
import { VBtn } from 'vuetify/lib/components';

let sessionTimeout = null;

const startSessionTimers = () => {
  const userStore = useUserStore();

  console.log('Starting session timers...');

  const sessionDuration = (userStore.tokenExpires * 1000) - Date.now();

  clearTimeout(sessionTimeout);

  console.log(`Session duration: ${sessionDuration}`);

  sessionTimeout = setTimeout(() => {
    console.log('Triggering session expiry...');
    handleSessionExpiry(userStore);
  }, sessionDuration);
};

const handleSessionExpiry = (userStore) => {
  console.log('Handling session expiry...');

  // 1. Сбросить состояние сессии в Pinia
  userStore.userLogoff();

  // 2. Показать алерт и перенаправить пользователя на страницу входа
  console.log('Triggering alert for session expiry...');
  alertSessionExpired(userStore);
};

const alertSessionExpired = (userStore) => {
  console.log('Showing alert for session expiry...');
  const alertDiv = document.createElement('div');
  alertDiv.innerHTML = `
    <div style="text-align: center;">
      <p>Ваша рабочая сессия истекла. Войдите в приложение заново.</p>
      <div id="loginButtonContainer" style="margin-top: 10px;"></div>
    </div>
  `;
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '50%';
  alertDiv.style.left = '50%';
  alertDiv.style.transform = 'translate(-50%, -50%)';
  alertDiv.style.backgroundColor = 'white';
  alertDiv.style.padding = '20px';
  alertDiv.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
  document.body.appendChild(alertDiv);

  const loginButtonContainer = document.getElementById('loginButtonContainer');
  createApp({
    render() {
      return h(VBtn, {
        color: 'teal darken-1',
        text: true,
        onClick: () => {
          console.log('User clicked login button. Redirecting to login module...');
          userStore.setActiveModule('Login');
          document.body.removeChild(alertDiv);
        },
      }, 'вход в приложение');
    },
  }).use(vuetify).mount(loginButtonContainer);
};

const resetSessionTimers = () => {
  startSessionTimers();
};

const getSessionDurations = () => ({
  sessionDuration: (useUserStore().tokenExpires * 1000 - Date.now()) / 1000, // в секундах
});

export { startSessionTimers, resetSessionTimers, getSessionDurations };