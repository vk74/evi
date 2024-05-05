<template>
  <div class="pt-3 pl-3 pr-3 pb-3">
    <v-card color="teal-lighten-1" elevation="1">
  <v-row>
    <v-col cols="auto">
      <br>&nbsp;
      <v-icon size="40">mdi-account-settings</v-icon><br>
    </v-col>
    <v-col>
      <v-card-title class="text-h5 mb-0">имя пользователя</v-card-title>
      <v-card-subtitle>компания / должность </v-card-subtitle>
    </v-col>
  </v-row>
</v-card>

  </div>
  <div>
    <h4>&nbsp;Модуль  "личный кабинет"</h4>
    &nbsp;Модуль будет использоваться для настроек пользовательского профиля, отображения личных данных, смены пароля и пр.
    <br><br>
    <h4>&nbsp;Current user state for debugging</h4>
    <p>&nbsp;Username: {{ username }}</p>
    <p>&nbsp;Issued token (JWT): {{ jwt }}</p>
    <p>&nbsp;isLoggedIn attribute: {{ isLoggedIn }}</p>
    <p>&nbsp;Token issued at: {{ issuedAt }}</p> 
    <p>&nbsp;Token issuer: {{ issuer }}</p> 
    <p>&nbsp;Token expires: {{ expiresAt }}</p> 
  </div>
</template>

<script>
export default {
  name: 'ModuleAccount',
  computed: {
    username() {
      return this.$store.state.username;
    },
    jwt() {
      return this.$store.state.jwt;
    },
    isLoggedIn() {
      return this.$store.state.isLoggedIn;
    },
    // Добавленные вычисляемые свойства
    issuedAt() {
      const iat = this.$store.state.issuedAt;
      return iat ? new Date(iat * 1000).toLocaleString() : 'N/A';
    },
    issuer() {
      return this.$store.state.issuer || 'N/A';
    },
    // JWT `exp` представляет собой временную метку Unix в секундах
    expiresAt() {
      const exp = this.$store.state.tokenExpires; // Убедитесь, что здесь используется правильный ключ состояния
      return exp ? new Date(exp * 1000).toLocaleString() : 'N/A';
    },
  },
};
</script>


<style>

</style>