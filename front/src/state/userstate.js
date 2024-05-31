// /src/state/userstate.js хранилище для отслеживания состояния пользователя

import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    username: '',        // Имя пользователя
    jwt: '',             // JWT токен
    isLoggedIn: false,   // Статус аутентификации
    issuer: '',          // Издатель токена
    audience: '',        // Аудитория токена
    issuedAt: '',        // Время выдачи токена
    jwtId: '',           // Уникальный идентификатор JWT
    tokenExpires: '',    // Время истечения токена
    activeModule: 'Catalog', // активный модуль в main work area
  }),

  actions: {
    // устанавливаем имя пользователя
    setUsername(username) {
      this.username = username;
    },
    // устанавливаем JWT токен
    setJwt(jwt) {
      this.jwt = jwt;
    },
    // устанавливаем статус аутентификации
    setLoggedIn(isLoggedIn) {
      this.isLoggedIn = isLoggedIn;
    },
    // устанавливаем издателя токена
    setIssuer(issuer) {
      this.issuer = issuer;
    },
    // устанавливаем аудиторию токена
    setAudience(audience) {
      this.audience = audience;
    },
    // устанавливаем время выдачи токена
    setIssuedAt(issuedAt) {
      this.issuedAt = issuedAt;
    },
    // устанавливаем уникальный идентификатор JWT
    setJwtId(jwtId) {
      this.jwtId = jwtId;
    },
    // устанавливаем время истечения токена
    setTokenExpires(exp) {
      this.tokenExpires = exp;
    },
    // устанавливаем активный модуль
    setActiveModule(module) {
      this.activeModule = module;
    },
    
    // действия для вызова методов установки значений
    updateUsername(username) {
      this.setUsername(username);
    },
    updateJwt(jwt) {
      this.setJwt(jwt);
      // здесь можно декодировать JWT и обновить остальные поля состояния
      // например, используя библиотеку jwt-decode (npm install jwt-decode)
      // const decoded = jwtDecode(jwt);
      // this.setIssuer(decoded.iss);
      // this.setAudience(decoded.aud);
      // this.setIssuedAt(decoded.iat);
      // this.setJwtId(decoded.jti);
    },
    updateLoggedIn(isLoggedIn) {
      this.setLoggedIn(isLoggedIn);
    },
    updateIssuer(issuer) {
      this.setIssuer(issuer);
    },
    updateAudience(audience) {
      this.setAudience(audience);
    },
    updateIssuedAt(issuedAt) {
      this.setIssuedAt(issuedAt);
    },
    updateJwtId(jwtId) {
      this.setJwtId(jwtId);
    },
    updateTokenExpires(exp) {
      this.setTokenExpires(exp);
    },

    // действие выхода из системы
    userLogoff() {
      localStorage.removeItem('userToken'); // Удаляем токен из localStorage
      this.setLoggedIn(false); // Обновляем состояние на не аутентифицировано
      // Очистка других связанных данных
      this.setUsername('');
      this.setJwt('');
      this.setIssuer('');
      this.setAudience('');
      this.setIssuedAt('');
      this.setJwtId('');
      this.setTokenExpires('');
    },
  },
});
