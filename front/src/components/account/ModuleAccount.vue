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
              <h3 class="white--text mb-0">{{ profile.username }}</h3>
              <div class="white--text subtitle-1">{{ profile.company_name }} / {{ profile.position }}</div>
            </v-col>
            <v-col class="d-flex justify-end" cols="auto">
              <v-btn color="teal darken-1" text @click="openChangePasswordModal">Сменить пароль</v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- profile card -->
      <v-col cols="12" md="6">
        <v-card class="pa-4" outlined elevation="2">
          <v-card-title>
            <span>данные профиля</span>
          </v-card-title>
          <v-text-field label="Фамилия" v-model="profile.last_name" readonly></v-text-field>
          <v-text-field label="Имя" v-model="profile.first_name" readonly></v-text-field>
          <v-text-field label="Отчество" v-model="profile.middle_name" readonly></v-text-field>
          <v-text-field label="Пол" v-model="profile.gender" readonly></v-text-field>
          <v-text-field label="Номер телефона" v-model="profile.phone_number" readonly></v-text-field>
          <v-text-field label="E-mail" v-model="profile.email" readonly></v-text-field>
          <v-text-field label="Адрес" v-model="profile.address" readonly></v-text-field>
          <v-text-field label="Название организации" v-model="profile.company_name" readonly></v-text-field>
          <v-text-field label="Должность" v-model="profile.position" readonly></v-text-field>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="teal darken-1" text @click="saveProfile">сохранить изменения</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- tech card -->
      <v-col cols="12" md="6">
        <v-card class="pa-4" outlined elevation="2">
          <v-card-title>
            <span>технические данные сессии</span>
            <v-spacer></v-spacer>
            <v-btn icon @click="toggleTechCard">
              <v-icon>{{ isTechCardExpanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
          </v-card-title>
          <v-expand-transition>
            <v-card-text v-show="isTechCardExpanded">
              Username: <b>{{ username }} </b> <br>
              Issued <b>JSON web token:</b> {{ jwt }} <br>
              isLoggedIn attribute: <b>{{ isLoggedIn }}</b> <br>
              Token issued at: <b>{{ issuedAt }} </b> <br>
              Token issuer: <b>{{ issuer }} </b> <br>
              Token expires: <b>{{ expiresAt }} </b> <br>
              Session will expire in: <b>{{ sessionDurations.sessionDuration }} seconds</b> <br>
              Session warning will be shown in: <b>{{ sessionDurations.warningDuration }} seconds</b> <br>
            </v-card-text>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>

    <!-- Modal for changing password -->
    <v-dialog v-model="isChangePasswordModalVisible" max-width="500px">
      <ModalChangeUserPass @close="closeChangePasswordModal" />
    </v-dialog>
  </v-container>
</template>

<script>
import { useUserStore } from '../../state/userstate'; // импорт Pinia store
import { computed } from 'vue';
import axios from 'axios';
import ModalChangeUserPass from './ModalChangeUserPass.vue'; // импорт компонента
import { getSessionDurations } from '../../services/sessionServices';

export default {
  name: 'ModuleAccount',
  components: {
    ModalChangeUserPass,
  },
  data() {
    return {
      profile: {
        last_name: '',
        first_name: '',
        middle_name: '',
        gender: '',
        phone_number: '',
        email: '',
        address: '',
        company_name: '',
        position: ''
      },
      settings: {
        workUpdates: false,
        newsletter: true,
      },
      isChangePasswordModalVisible: false,
      isTechCardExpanded: true,
      sessionDurations: getSessionDurations(),
    };
  },
  async mounted() {
    const userStore = useUserStore();

    if (userStore.isLoggedIn) {
      try {
        const response = await axios.get('http://localhost:3000/profile', {
          headers: { Authorization: `Bearer ${userStore.jwt}` },
        });
        this.profile = response.data;
      } catch (error) {
        console.error('Ошибка при загрузке данных профиля пользователя ev2:', error);
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
  },
  methods: {
    openChangePasswordModal() {
      this.isChangePasswordModalVisible = true;
    },
    closeChangePasswordModal() {
      this.isChangePasswordModalVisible = false;
    },
    toggleTechCard() {
      this.isTechCardExpanded = !this.isTechCardExpanded;
    },
    saveProfile() {
      // Функция для сохранения изменений профиля
    },
  },
};
</script>

<style scoped>
.v-card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.v-btn {
  border-radius: 8px;
}
</style>
