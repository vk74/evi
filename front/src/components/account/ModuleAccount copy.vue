<template>
  <v-container fluid>
    <v-row>

      <!-- user banner -->
      <v-col cols="12">
        <v-card class="pa-4" color="blue-grey-lighten-5" elevation="2" >
          <v-row align="center">
            <v-col cols="3" sm="2" md="1">
              <v-avatar size="96px" class="elevation-7">
                <img :src="require('@/assets/user-profile-default-male.jpg')" alt="User's avatar">
              </v-avatar>
            </v-col>
            <v-col>
              <h3 class="white--text mb-0">{{ username }}</h3>
              <div class="white--text subtitle-1">ПУЛЬС / Менеджер по развитию бизнеса</div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- profile card -->
      <v-col cols="12" md="6">
        <v-card class="pa-4" outlined elevation="2" title="данные профиля">
          <v-list two-line>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>телефон</v-list-item-title>
                <v-list-item-subtitle>{{ profile.telephone }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>email</v-list-item-title>
                <v-list-item-subtitle>{{ profile.email }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>адрес</v-list-item-title>
                <v-list-item-subtitle>{{ profile.address }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </v-list>

        </v-card>
      </v-col>

      <!-- tech card -->
      <v-col cols="12" md="6">
        <v-card class="pa-4" outlined elevation="2" title="технические данные сессии">
          Username: <b>{{ username }} </b> <br>
          Issued <b>JSON web token:</b> {{ jwt }} <br>
          isLoggedIn attribute: <b>{{ isLoggedIn }}</b> <br>
          Token issued at: <b>{{ issuedAt }} </b> <br>
          Token issuer: <b>{{ issuer }} </b> <br>
          Token expires: <b>{{ expiresAt }} </b> <br>
        </v-card>
      </v-col>

      <!-- settings card 
      <v-col cols="12" md="6">
        <v-card class="pa-4" outlined elevation="2" title="настройки для пользователя">
          <v-list two-line>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>оповещать при обновлениях мойх рабочих элементов</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-switch v-model="settings.workUpdates"></v-switch>
              </v-list-item-action>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>отправлять новости</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-switch v-model="settings.newsletter"></v-switch>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col> -->

    </v-row>
  </v-container>

</template>

<script>
export default {
  name: 'ModuleAccount',
  data() {
    return {
      profile: {
        telephone: '(985) 123 1234 123',
        email: 'atest@mail.ru',
        address: 'ул. Гагарина 123, Ростов, Россия',
      },
      settings: {
        workUpdates: false,
        newsletter: true,
      },
    };
  },
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
