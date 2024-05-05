import { createApp } from 'vue';
import App from './App.vue';
import i18n from './i18n';
import axios from 'axios';
import '/styles/global.css';
import store from './store/userstate';
import vuetify from './plugins/vuetify'; // импорт экземпляра Vuetify
import '@mdi/font/css/materialdesignicons.css';

import { jwtDecode } from 'jwt-decode';  // библиотека для декодирования JWT
//import jwtDecode from 'jwt-decode';

const app = createApp(App);

//добавляем библиотеку для локализации текстовых данных
app.use(i18n);

// добавляем библиотеки Vuetify в запускаемый экземпляр приложения
app.use(vuetify);

// добавляем axios как глобальное свойство
app.config.globalProperties.$http = axios;

const token = localStorage.getItem('userToken');
if (token) {
    try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // получаем текущее время в секундах

        if (decoded.exp < currentTime) {
            // если время истечения токена уже прошло
            localStorage.removeItem('userToken'); // удаляем токен из localStorage
            store.commit('setLoggedIn', false);
            // очищаем дополнительные связанные с токеном данные
            store.commit('setUsername', '');
            store.commit('setJwt', '');
        } else {
            // если токен все еще действителен
            store.commit('setLoggedIn', true);
            store.commit('setUsername', decoded.sub);
            store.commit('setJwt', token);
            store.commit('setIssuer', decoded.iss);
            store.commit('setAudience', decoded.aud);
            store.commit('setIssuedAt', decoded.iat);
            store.commit('setJwtId', decoded.jti);
            store.commit('setTokenExpires', decoded.exp);
        }
    } catch (error) {
        console.error('Ошибка при декодировании JWT:', error);
        localStorage.removeItem('userToken'); // в случае ошибки также удаляем токен
        store.commit('setLoggedIn', false);
    }
} else {
    // если токен отсутствует
    store.commit('setLoggedIn', false);
}

// добавление Vuex хранилища к приложению
app.use(store);

// монтирование приложения
app.mount('#app');