// src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createI18n } from 'vue-i18n';
import { startSessionTimers } from './services/sessionServices';
import axios from 'axios';
import '/styles/global.css';
import vuetify from './plugins/vuetify';
import '@mdi/font/css/materialdesignicons.css';
import { jwtDecode } from 'jwt-decode';

// Импорт всех файлов локализации
import appRu from './components/AppTranslationRU.json';
import appEn from './components/AppTranslationEN.json';
import admpanRu from './components/admin/AdminTranslationRU.json';
import admpanEn from './components/admin/AdminTranslationEN.json';

console.log('Starting application...');
console.log('App component:', App);
console.log('All imports completed');

// Объединяем переводы
const messages = {
  ru: {
    ...appRu,
    ...admpanRu
  },
  en: {
    ...appEn,
    ...admpanEn
  }
};

// Создаем экземпляр i18n
const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('userLanguage') || 'ru',
  fallbackLocale: 'ru',
  messages
});

// Создаем приложение
const app = createApp(App);
console.log('App instance created');
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// Устанавливаем плагины
app.use(pinia);
app.use(i18n);
app.use(vuetify);
app.config.globalProperties.$http = axios;

// Функция инициализации состояния пользователя
const initializeUserState = async () => {
  const { useUserStore } = await import('./state/userstate');
  const userStore = useUserStore();
  
  const token = localStorage.getItem('userToken');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        localStorage.removeItem('userToken');
        userStore.setLoggedIn(false);
        userStore.setUsername('');
        userStore.setJwt('');
      } else {
        userStore.setLoggedIn(true);
        userStore.setUsername(decoded.sub);
        userStore.setJwt(token);
        userStore.setIssuer(decoded.iss);
        userStore.setAudience(decoded.aud);
        userStore.setIssuedAt(decoded.iat);
        userStore.setJwtId(decoded.jti);
        userStore.setTokenExpires(decoded.exp);
        startSessionTimers();
      }
    } catch (error) {
      console.error('Ошибка при декодировании JWT:', error);
      localStorage.removeItem('userToken');
      userStore.setLoggedIn(false);
    }
  } else {
    userStore.setLoggedIn(false);
  }
};

// Монтируем приложение и инициализируем состояние
app.mount('#app');
console.log('App mounted');
initializeUserState();