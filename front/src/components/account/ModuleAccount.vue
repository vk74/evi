<template>
  <v-container fluid>
    <v-row>
      <!-- user banner -->
      <v-col cols="12">
        <v-card class="pa-4" color="blue-grey-lighten-5" elevation="2">
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
        <v-card class="pa-4" outlined elevation="2">
          <v-text-field label="First Name" :value="profile.first_name" readonly></v-text-field>
          <v-text-field label="Last Name" :value="profile.last_name" readonly></v-text-field>
          <v-text-field label="Middle Name" :value="profile.middle_name" readonly></v-text-field>
          <v-text-field label="Phone Number" :value="profile.phone_number" readonly></v-text-field>
          <v-text-field label="Email" :value="profile.email" readonly></v-text-field>
          <v-text-field label="Address" :value="profile.address" readonly></v-text-field>
          <v-text-field label="Company Name" :value="profile.company_name" readonly></v-text-field>
          <v-text-field label="Position" :value="profile.position" readonly></v-text-field>
          <v-text-field label="Gender" :value="profile.gender" readonly></v-text-field>
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
import { useUserStore } from '../../state/userstate'; // импорт Pinia store
import { computed } from 'vue';

export default {
  name: 'ModuleAccount',
  data() {
    return {
      profile: {}, // изначально пустой объект, будет заполнен данными профиля
      settings: {
        workUpdates: false,
        newsletter: true,
      },
    };
  },
  async mounted() {
    const userStore = useUserStore();

    if (userStore.isLoggedIn) {
      try {
        // Используйте this.$http.get для отправки запроса
        const response = await this.$http.get('http://localhost:3000/profile', {
          headers: { Authorization: `Bearer ${userStore.jwt}` },
        });
        this.profile = response.data;
      } catch (error) {
        console.error('Ошибка при загрузке данных профиля:', error);
        // Обработка ошибок
      }
    }
  },
  setup() {
    const userStore = useUserStore();

    return {
      username: computed(() => userStore.username),
      jwt: computed(() => userStore.jwt),
      isLoggedIn: computed(() => userStore.isLoggedIn),
      issuedAt: computed(() => {
        const iat = userStore.issuedAt;
        return iat ? new Date(iat * 1000).toLocaleString() : 'N/A';
      }),
      issuer: computed(() => userStore.issuer || 'N/A'),
      expiresAt: computed(() => {
        const exp = userStore.tokenExpires;
        return exp ? new Date(exp * 1000).toLocaleString() : 'N/A';
      }),
    };
  }
};
</script>

<style>
/* ваши стили */
</style>