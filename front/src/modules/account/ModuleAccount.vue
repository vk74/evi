<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserAuthStore } from '@/core/auth/state.user.auth'
import { useUserAccountStore } from '@/modules/account/state.user.account'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import axios from 'axios'
import ChangePassword from '@/core/ui/modals/change-password/ChangePassword.vue'
import { PasswordChangeMode } from '@/core/ui/modals/change-password/types.change.password'

// ==================== STORES ====================
const userStore = useUserAuthStore()
const userAccountStore = useUserAccountStore()
const uiStore = useUiStore()
const { t } = useI18n()

// ==================== REFS & STATE ====================
const form = ref(null)
const isFormValid = ref(false)
const isSubmitting = ref(false)

const profile = ref({
  last_name: '',
  first_name: '',
  middle_name: '',
  gender: '',
  phone_number: '',
  email: '',
  address: '',
  company_name: '',
  position: ''
})

const isChangePasswordModalVisible = ref(false)

// ==================== COMPUTED ====================
const username = computed(() => userStore.username)

// ==================== VALIDATION RULES ====================
const lastNameRules = [
  (v) => !!v || 'Фамилия обязательна',
  (v) => v.length >= 2 || 'Фамилия должна содержать минимум 2 символа',
  (v) => v.length <= 50 || 'Фамилия не должна превышать 50 символов'
]

const firstNameRules = [
  (v) => !!v || 'Имя обязательно',
  (v) => v.length >= 2 || 'Имя должно содержать минимум 2 символа',
  (v) => v.length <= 50 || 'Имя не должно превышать 50 символов'
]

const middleNameRules = [
  (v) => !v || v.length <= 50 || 'Отчество не должно превышать 50 символов'
]

const genderRules = [
  (v) => !v || v.length <= 20 || 'Пол не должен превышать 20 символов'
]

const phoneRules = [
  (v) => !v || /^[\+]?[0-9\s\-\(\)]+$/.test(v) || 'Неверный формат номера телефона',
  (v) => !v || v.length <= 20 || 'Номер телефона не должен превышать 20 символов'
]

const emailRules = [
  (v) => !v || /.+@.+\..+/.test(v) || 'Неверный формат email',
  (v) => !v || v.length <= 100 || 'Email не должен превышать 100 символов'
]

const addressRules = [
  (v) => !v || v.length <= 200 || 'Адрес не должен превышать 200 символов'
]

const companyRules = [
  (v) => !v || v.length <= 100 || 'Название организации не должно превышать 100 символов'
]

const positionRules = [
  (v) => !v || v.length <= 100 || 'Должность не должна превышать 100 символов'
]

// ==================== METHODS ====================
const openChangePasswordModal = () => {
  isChangePasswordModalVisible.value = true
}

const closeChangePasswordModal = () => {
  isChangePasswordModalVisible.value = false
}

const saveProfile = async () => {
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar('Пожалуйста, заполните все обязательные поля')
    return
  }

  if (userStore.isAuthenticated) {
    isSubmitting.value = true
    
    try {
      console.log('sending request to update user profile data:', profile.value)
      const response = await axios.post('http://localhost:3000/profile', profile.value, {
        headers: { Authorization: `Bearer ${userStore.jwt}` },
      })
      console.log('Profile updated successfully:', response.data)
      uiStore.showSuccessSnackbar('Данные профиля успешно обновлены')
      // Update profile in account store
      userAccountStore.updateProfile(profile.value)
    } catch (error) {
      console.error('Error on save of user profile data:', error)
      uiStore.showErrorSnackbar('Ошибка при обновлении данных профиля')
    } finally {
      isSubmitting.value = false
    }
  }
}

const cancelEdit = () => {
  // Reset form to original values
  loadProfileData()
}

const loadProfileData = async () => {
  if (userStore.isAuthenticated) {
    try {
      const response = await axios.get('http://localhost:3000/profile', {
        headers: { Authorization: `Bearer ${userStore.jwt}` },
      })
      profile.value = response.data
      // Update profile in account store
      userAccountStore.updateProfile(profile.value)
    } catch (error) {
      console.error('Error on load of user profile data:', error)
      uiStore.showErrorSnackbar('Ошибка при загрузке данных профиля')
    }
  }
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
  await loadProfileData()
})
</script>

<template>
  <v-container class="pa-0 ma-0">
    <!-- Work area with main form -->
    <div class="d-flex">
      <!-- Main content (left part) -->
      <div class="flex-grow-1">
        <v-container class="content-container pa-0 ma-0">
          <v-card flat class="ma-0 pa-6">
            <v-form
              ref="form"
              v-model="isFormValid"
            >
              <!-- Form header -->
              <div class="form-header mb-4">
                <h4 class="text-h6 font-weight-medium">
                  Профиль пользователя
                </h4>
              </div>
              
              <v-row>
                <!-- Personal Information section -->
                <v-col cols="12">
                  <div class="card-header">
                    <v-card-title class="text-subtitle-1">
                      Личная информация
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model="profile.last_name"
                        label="Фамилия"
                        :rules="lastNameRules"
                        variant="outlined"
                        density="comfortable"
                        required
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model="profile.first_name"
                        label="Имя"
                        :rules="firstNameRules"
                        variant="outlined"
                        density="comfortable"
                        required
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model="profile.middle_name"
                        label="Отчество"
                        :rules="middleNameRules"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="profile.gender"
                        label="Пол"
                        :rules="genderRules"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Contact Information section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      Контактные данные
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="profile.phone_number"
                        label="Номер телефона"
                        :rules="phoneRules"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="profile.email"
                        label="E-mail"
                        :rules="emailRules"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="profile.address"
                        label="Адрес"
                        :rules="addressRules"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Work Information section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      Рабочая информация
                    </v-card-title>
                    <v-divider class="section-divider" />
                  </div>

                  <v-row class="pt-3">
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="profile.company_name"
                        label="Название организации"
                        :rules="companyRules"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="profile.position"
                        label="Должность"
                        :rules="positionRules"
                        variant="outlined"
                        density="comfortable"
                      />
                    </v-col>
                  </v-row>
                </v-col>
              </v-row>
            </v-form>
          </v-card>
        </v-container>
      </div>
      
      <!-- Sidebar (right part) -->
      <div class="side-bar-container">
        <!-- Actions section -->
        <div class="side-bar-section">
          <h3 class="text-subtitle-2 px-2 py-2">
            Действия
          </h3>
          
          <!-- Save button -->
          <v-btn
            block
            color="teal"
            variant="outlined"
            :disabled="!isFormValid || isSubmitting"
            class="mb-3"
            @click="saveProfile"
          >
            Сохранить
          </v-btn>

          <!-- Change password button -->
          <v-btn
            block
            color="blue"
            variant="outlined"
            class="mb-3"
            @click="openChangePasswordModal"
          >
            Изменить пароль
          </v-btn>

          <!-- Cancel button -->
          <v-btn
            block
            color="grey"
            variant="outlined"
            class="mb-3"
            @click="cancelEdit"
          >
            Отменить
          </v-btn>
        </div>
      </div>
    </div>

  </v-container>

  <!-- Modal for changing password -->
  <v-dialog
    v-model="isChangePasswordModalVisible"
    max-width="550px"
  >
    <ChangePassword
      :title="$t('passwordChange.resetPassword') + ' ' + username"
      :uuid="userStore.userID"
      :username="username"
      :mode="PasswordChangeMode.SELF"
      :on-close="closeChangePasswordModal"
    />
  </v-dialog>
</template>

<style scoped>
/* Sidebar styles */
.side-bar-container {
  width: 18%;
  min-width: 220px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  display: flex;
  flex-direction: column;
}

.side-bar-section {
  padding: 16px;
}

/* Card header styles */
.card-header {
  margin-bottom: 16px;
}

.section-divider {
  margin-top: 8px;
}



/* Content container */
.content-container {
  padding: 0 15px;
}
</style>