// /src/state/userstate.js хранилище для отслеживания состояния пользователя

import { createStore } from 'vuex';

// Инициализация состояния пользователя
const state = {
  username: '',        // Имя пользователя
  jwt: '',             // JWT токен
  isLoggedIn: false,   // Статус аутентификации
  issuer: '',          // Издатель токена
  audience: '',        // Аудитория токена
  issuedAt: '',        // Время выдачи токена
  jwtId: '',           // Уникальный идентификатор JWT
  activeModule: 'Catalog', // активный модуль в main work area  
};

// Мутации для обновления состояния
const mutations = {
  // устанавливаем имя пользователя
  setUsername(state, username) {
    state.username = username;
  },
  // устанавливаем JWT токен
  setJwt(state, jwt) {
    state.jwt = jwt;
  },
  // устанавливаем статус аутентификации
  setLoggedIn(state, isLoggedIn) {
    state.isLoggedIn = isLoggedIn;
  },
  // устанавливаем издателя токена
  setIssuer(state, issuer) {
    state.issuer = issuer;
  },
  // устанавливаем аудиторию токена
  setAudience(state, audience) {
    state.audience = audience;
  },
  // устанавливаем время выдачи токена
  setIssuedAt(state, issuedAt) {
    state.issuedAt = issuedAt;
  },
  // устанавливаем уникальный идентификатор JWT
  setJwtId(state, jwtId) {
    state.jwtId = jwtId;
  },
  setTokenExpires(state, exp) {
    state.tokenExpires = exp;
  },
  // устанавливаем активный модуль
  setActiveModule(state, module) {
    state.activeModule = module;
  },
};

// действия для вызова мутаций
const actions = {
  // вызываем мутацию setUsername
  updateUsername({ commit }, username) {
    commit('setUsername', username);
  },
  // вызываем мутацию setJwt
  updateJwt({ commit }, jwt) {
    commit('setJwt', jwt);
    // здесь можно декодировать JWT и обновить остальные поля состояния
    // например, используя библиотеку jwt-decode (npm install jwt-decode)
    // const decoded = jwtDecode(jwt);
    // commit('setIssuer', decoded.iss);
    // commit('setAudience', decoded.aud);
    // commit('setIssuedAt', decoded.iat);
    // commit('setJwtId', decoded.jti);
  },
  // вызываем мутацию setLoggedIn
  updateLoggedIn({ commit }, isLoggedIn) {
    commit('setLoggedIn', isLoggedIn);
  },
  // добавляем новые действия для обновления дополнительных полей
  updateIssuer({ commit }, issuer) {
    commit('setIssuer', issuer);
  },
  updateAudience({ commit }, audience) {
    commit('setAudience', audience);
  },
  updateIssuedAt({ commit }, issuedAt) {
    commit('setIssuedAt', issuedAt);
  },
  updateJwtId({ commit }, jwtId) {
    commit('setJwtId', jwtId);
  },
  updateTokenExpires({ commit }, exp) {
    commit('setTokenExpires', exp);
  },

  // действие выхода из системы
  userLogoff({ commit }) {
    localStorage.removeItem('userToken'); // Удаляем токен из localStorage
    commit('setLoggedIn', false); // Обновляем состояние на не аутентифицировано
    // Очистка других связанных данных
    commit('setUsername', '');
    commit('setJwt', '');
    commit('setIssuer', '');
    commit('setAudience', '');
    commit('setIssuedAt', '');
    commit('setJwtId', '');
    commit('setTokenExpires', '');
  },
};
  
// Создание хранилища Vuex с инициализированным состоянием, мутациями и действиями
export default createStore({
  state,
  mutations,
  actions
});