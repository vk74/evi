<template>
  <v-container fluid>
    <v-row>
      <!-- user banner -->
      <v-col cols="12">
        <v-card
          class="pa-4"
          color="blue-grey-lighten-5"
          elevation="2"
        >
          <v-row align="center">
            <v-col
              cols="3"
              sm="2"
              md="1"
            >
              <v-avatar
                size="96px"
                class="elevation-7"
              >
                <img
                  :src="require('@/assets/user-profile-default-male.jpg')"
                  alt="User's avatar"
                >
              </v-avatar>
            </v-col>
            <v-col>
              <h3 class="white--text mb-0">
                {{ profile.first_name }} {{ profile.last_name }}
              </h3><br>
              <div class="white--text subtitle-1">
                {{ profile.company_name }} / {{ profile.position }}
              </div>
              <div class="white--text subtitle-2">
                {{ username }}
              </div>
            </v-col>
            <v-col
              class="d-flex justify-end"
              cols="auto"
            >
              <v-btn
                color="teal darken-1"
                text
                @click="openChangePasswordModal"
              >
                изменить пароль
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- profile card -->
      <v-col
        cols="12"
        md="6"
      >
        <v-card
          class="pa-4"
          outlined
          elevation="2"
        >
          <v-card-title>
            <span>профиль пользователя</span>
          </v-card-title>
          <v-text-field
            v-model="profile.last_name"
            label="фамилия"
          />
          <v-text-field
            v-model="profile.first_name"
            label="имя"
          />
          <v-text-field
            v-model="profile.middle_name"
            label="отчество"
          />
          <v-text-field
            v-model="profile.gender"
            label="пол"
          />
          <v-text-field
            v-model="profile.phone_number"
            label="номер телефона"
          />
          <v-text-field
            v-model="profile.email"
            label="E-mail"
          />
          <v-text-field
            v-model="profile.address"
            label="адрес"
          />
          <v-text-field
            v-model="profile.company_name"
            label="название организации"
          />
          <v-text-field
            v-model="profile.position"
            label="должность"
          />
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="teal darken-1"
              text
              @click="saveProfile"
            >
              сохранить изменения
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- tech card -->
      <v-col
        cols="12"
        md="6"
      >
        <v-card
          class="pa-4"
          outlined
          elevation="2"
        >
          <v-card-title>
            <span>технические данные сессии</span>
            <v-spacer />
            <v-btn
              icon
              @click="toggleTechCard"
            >
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
    <v-dialog
      v-model="isChangePasswordModalVisible"
      max-width="500px"
    >
      <ModalChangeUserPass @close="closeChangePasswordModal" />
    </v-dialog>

    <!-- Snackbar for success message -->
    <v-snackbar
      v-model="snackbar"
      :timeout="3000"
      :color="snackbarColor"
      absolute
      top
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script>
import { useUserStore } from '@/core/state/userstate'; 
import { computed } from 'vue';
import axios from 'axios';
import ModalChangeUserPass from './ModalChangeUserPass.vue'; 
import { getSessionDurations } from '@/core/services/sessionServices';

export default {
  name: 'ModuleAccount',
  components: {
    ModalChangeUserPass,
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
      snackbar: false,
      snackbarMessage: '',
      snackbarColor: 'teal'
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
        console.error('Error on load of user profile data:', error);
      }
    }
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
    async saveProfile() {
      const userStore = useUserStore();

      if (userStore.isLoggedIn) {
        try {
          console.log('sending request to update user profile data:', this.profile);
          const response = await axios.post('http://localhost:3000/profile', this.profile, {
            headers: { Authorization: `Bearer ${userStore.jwt}` },
          });
          console.log('Profile updated successfully:', response.data);
          this.snackbarMessage = 'данные профиля успешно обновлены';
          this.snackbarColor = 'teal';
          this.snackbar = true;
        } catch (error) {
          console.error('Error on save of user profile data:', error);
          this.snackbarMessage = 'ошибка при обновлении данных профиля';
          this.snackbarColor = 'red';
          this.snackbar = true;
        }
      }
    }
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

.v-snackbar {
  top: 50px !important;
}
</style>