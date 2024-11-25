// /src/state/userstate.js хранилище для отслеживания состояния
import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';

export const useUserStore = defineStore('user', {
  state: () => ({
    username: '', // Имя пользователя
    jwt: '', // JWT токен
    isLoggedIn: false, // Статус аутентификации
    issuer: '', // Издатель токена
    audience: '', // Аудитория токена
    issuedAt: '', // Время выдачи токена
    jwtId: '', // Уникальный идентификатор JWT
    tokenExpires: '', // Время истечения токена
    activeModule: 'Catalog', // активный модуль в main work area
    language: localStorage.getItem('userLanguage') || 'ru' // Язык интерфейса, по умолчанию русский
  }),

  getters: {
    // Проверка валидности токена
    isTokenValid: (state) => {
      if (!state.tokenExpires) return false;
      const currentTime = Date.now() / 1000;
      return state.tokenExpires > currentTime;
    }
  },

  actions: {
    // устанавливаем имя пользователя
    setUsername(username) {
      this.username = username;
    },
    // устанавливаем JWT токен
    setJwt(jwt) {
      this.jwt = jwt;
      if (jwt) {
        try {
          const decoded = jwtDecode(jwt);
          this.setIssuer(decoded.iss);
          this.setAudience(decoded.aud);
          this.setIssuedAt(decoded.iat);
          this.setJwtId(decoded.jti);
          this.setTokenExpires(decoded.exp);
        } catch (error) {
          console.error('Error decoding JWT:', error);
          this.userLogoff();
        }
      }
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
    // устанавливаем язык интерфейса
    setLanguage(lang) {
      this.language = lang;
      localStorage.setItem('userLanguage', lang);
    },
    // действия для вызова методов установки значений
    updateUsername(username) {
      this.setUsername(username);
    },
    updateJwt(jwt) {
      this.setJwt(jwt);
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
      const currentLang = this.language; // Сохраняем текущий язык
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
      this.language = currentLang; // Восстанавливаем язык после очистки
    },

    // Проверка и восстановление сессии
    validateAndRestoreSession() {
      console.log('Validating session...');
      if (!this.jwt) {
        console.log('No JWT found, session invalid');
        return false;
      }

      try {
        if (!this.isTokenValid) {
          console.log('Token expired, logging out');
          this.userLogoff();
          return false;
        }

        this.setLoggedIn(true);
        return true;
      } catch (error) {
        console.error('Error validating session:', error);
        this.userLogoff();
        return false;
      }
    }
  },

  persist: {
    key: 'user-session',
    storage: localStorage,
    paths: ['jwt', 'username', 'language', 'activeModule'], // Сохраняем только необходимые поля
    beforeRestore: (context) => {
      console.log('Restoring user session...');
    },
    afterRestore: (context) => {
      // Проверяем валидность сессии после восстановления
      const store = useUserStore();
      if (!store.validateAndRestoreSession()) {
        console.log('Session invalid or expired');
      } else {
        console.log('Session restored successfully');
      }
    }
  }
});