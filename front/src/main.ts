// src/main.ts
import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createI18n } from 'vue-i18n';

import axios from 'axios';
import '/styles/global.css';
import vuetify from './plugins/vuetify';
import '@mdi/font/css/materialdesignicons.css';
import { jwtDecode } from 'jwt-decode';

// Импорт всех файлов локализации
import translations from '@/core/services/translations.index'

interface JwtPayload {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  jti: string;
  exp: number;
}

console.log('Starting application...');
console.log('App component:', App);
console.log('All imports complete');

// Объединяем переводы
const messages = translations;

// Создаем экземпляр i18n с безопасной инициализацией
const getInitialLocale = (): string => {
  try {
    const stored = localStorage.getItem('userLanguage');
    return stored && (stored === 'ru' || stored === 'en') ? stored : 'ru';
  } catch {
    return 'ru';
  }
};

const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
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
const initializeUserState = async (): Promise<void> => {
  const { useUserAuthStore } = await import('@/core/auth/state.user.auth');
  const userStore = useUserAuthStore();
  
  const token = localStorage.getItem('userToken');
  if (token) {
    try {
      const decoded: JwtPayload = jwtDecode(token);
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
      }
    } catch (error) {
      console.error('Ошибка при декодировании JWT:', error);
      localStorage.removeItem('userToken');
      userStore.setLoggedIn(false);
    }
  } else {
    userStore.setLoggedIn(false);
  }
  
  // Update i18n locale if user has different language preference
  if (userStore.language && userStore.language !== i18n.global.locale.value) {
    i18n.global.locale.value = userStore.language as 'ru' | 'en';
  }
};

// Монтируем приложение и инициализируем состояние
app.mount('#app');
console.log('App mounted');
initializeUserState(); 