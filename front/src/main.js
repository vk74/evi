// src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { startSessionTimers } from './services/sessionServices';
import i18n from './i18n';
import axios from 'axios';
import '/styles/global.css';
import vuetify from './plugins/vuetify'; // импорт экземпляра Vuetify
import '@mdi/font/css/materialdesignicons.css';
import { jwtDecode } from 'jwt-decode';  // библиотека для декодирования JWT
//import jwtDecode from 'jwt-decode';
import { useUserStore } from './state/userstate'; // импорт Pinia store

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(i18n); // добавляем библиотеку для локализации текстовых данных
app.use(vuetify); // добавляем библиотеки Vuetify в запускаемый экземпляр приложения

app.config.globalProperties.$http = axios; // добавляем axios как глобальное свойство

const token = localStorage.getItem('userToken');
if (token) {
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // получаем текущее время в секундах
        const userStore = useUserStore(); // получаем доступ к Pinia хранилищу

        if (decoded.exp < currentTime) {
            // если время истечения токена уже прошло
            localStorage.removeItem('userToken'); // удаляем токен из localStorage
            userStore.setLoggedIn(false);
            // очищаем дополнительные связанные с токеном данные
            userStore.setUsername('');
            userStore.setJwt('');
        } else {
            // если токен все еще действителен
            userStore.setLoggedIn(true);
            userStore.setUsername(decoded.sub);
            userStore.setJwt(token);
            userStore.setIssuer(decoded.iss);
            userStore.setAudience(decoded.aud);
            userStore.setIssuedAt(decoded.iat);
            userStore.setJwtId(decoded.jti);
            userStore.setTokenExpires(decoded.exp);
            startSessionTimers(); // запуск таймеров сессии при старте приложения
        }
    } catch (error) {
        console.error('Ошибка при декодировании JWT:', error);
        localStorage.removeItem('userToken'); // в случае ошибки также удаляем токен
        const userStore = useUserStore(); // получаем доступ к Pinia хранилищу
        userStore.setLoggedIn(false);
    }
} else {
    // если токен отсутствует
    const userStore = useUserStore(); // получаем доступ к Pinia хранилищу
    userStore.setLoggedIn(false);
}

app.mount('#app');
