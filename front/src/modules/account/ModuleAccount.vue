<!--
  File: ModuleAccount.vue
  Version: 1.0.1
  Description: Frontend component for user account profile management
  Purpose: Provides interface for users to view and edit their profile information
  Features:
  - Display and edit user profile data
  - Form validation with custom rules
  - Change password functionality
  - Real-time form validation
  - Responsive design with sidebar actions
-->

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserAuthStore } from '@/core/auth/state.user.auth'
import { useUserAccountStore } from '@/modules/account/state.user.account'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/core/state/uistate'
import { api } from '@/core/api/service.axios'
import ChangePassword from '@/core/ui/modals/change-password/ChangePassword.vue'
import { PasswordChangeMode } from '@/core/ui/modals/change-password/types.change.password'
import { UserProfile, Gender, GenderOption } from '@/modules/account/types.user.account'
import { PhCaretUpDown } from '@phosphor-icons/vue'

// ==================== STORES ====================
const userStore = useUserAuthStore()
const userAccountStore = useUserAccountStore()
const uiStore = useUiStore()
const { t } = useI18n()

// ==================== REFS & STATE ====================
const form = ref<any>(null)
const isFormValid = ref(false)
const isSubmitting = ref(false)

const profile = ref<UserProfile>({
  last_name: '',
  first_name: '',
  middle_name: '',
  gender: '',
  phone_number: '',
  email: ''
})

const isChangePasswordModalVisible = ref(false)

// Gender options for dropdown with backend-compatible values
const genderOptions: GenderOption[] = [
  { title: t('account.profile.fields.gender.options.male'), value: Gender.MALE },
  { title: t('account.profile.fields.gender.options.female'), value: Gender.FEMALE },
  { title: t('account.profile.fields.gender.options.notDefined'), value: Gender.NOT_DEFINED },
  { title: t('account.profile.fields.gender.options.notSelected'), value: '' }
]

// ==================== COMPUTED ====================
const username = computed(() => userStore.username)

// ==================== VALIDATION RULES ====================
const lastNameRules = [
  (v: string) => !!v || t('account.profile.fields.lastName.validation.required'),
  (v: string) => v.length >= 2 || t('account.profile.fields.lastName.validation.minLength'),
  (v: string) => v.length <= 50 || t('account.profile.fields.lastName.validation.maxLength')
]

const firstNameRules = [
  (v: string) => !!v || t('account.profile.fields.firstName.validation.required'),
  (v: string) => v.length >= 2 || t('account.profile.fields.firstName.validation.minLength'),
  (v: string) => v.length <= 50 || t('account.profile.fields.firstName.validation.maxLength')
]

const middleNameRules = [
  (v: string) => !v || v.length <= 50 || t('account.profile.fields.middleName.validation.maxLength')
]

const genderRules = [
  (v: string) => !v || v.length <= 20 || t('account.profile.fields.gender.validation.maxLength')
]

const phoneRules = [
  (v: string) => !v || /^[\+]?[0-9\s\-\(\)]+$/.test(v) || t('account.profile.fields.phoneNumber.validation.format'),
  (v: string) => !v || v.length <= 20 || t('account.profile.fields.phoneNumber.validation.maxLength')
]

const emailRules = [
  (v: string) => !v || /.+@.+\..+/.test(v) || t('account.profile.fields.email.validation.format'),
  (v: string) => !v || v.length <= 100 || t('account.profile.fields.email.validation.maxLength')
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
    uiStore.showErrorSnackbar(t('account.profile.messages.validationError'))
    return
  }

  if (userStore.isAuthenticated) {
    isSubmitting.value = true
    
    try {
      console.log('sending request to update user profile data:', profile.value)
      const response = await api.post('/api/auth/profile', profile.value)
      console.log('Profile updated successfully:', response.data)
      uiStore.showSuccessSnackbar(t('account.profile.messages.saveSuccess'))
      // Update profile in account store
      userAccountStore.updateProfile(profile.value)
    } catch (error) {
      console.error('Error on save of user profile data:', error)
      uiStore.showErrorSnackbar(t('account.profile.messages.saveError'))
    } finally {
      isSubmitting.value = false
    }
  }
}



const loadProfileData = async () => {
  if (userStore.isAuthenticated) {
    try {
      const response = await api.get('/api/auth/profile')
      profile.value = response.data
      // Update profile in account store
      userAccountStore.updateProfile(profile.value)
    } catch (error) {
      console.error('Error on load of user profile data:', error)
      uiStore.showErrorSnackbar(t('account.profile.messages.loadError'))
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
          <v-card
            flat
            class="ma-0 pa-6"
          >
            <v-form
              ref="form"
              v-model="isFormValid"
            >
              <!-- Form header -->
              <div class="form-header mb-4">
                <h4 class="text-h6 font-weight-medium">
                  {{ t('account.profile.title') }}
                </h4>
              </div>
              
              <v-row>
                <!-- Personal Information section -->
                <v-col cols="12">
                  <div class="card-header">
                    <v-card-title class="text-subtitle-1">
                      {{ t('account.profile.sections.personalInfo') }}
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
                        :label="t('account.profile.fields.lastName.label')"
                        :rules="lastNameRules"
                        variant="outlined"
                        density="comfortable"
                        color="teal"
                        required
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model="profile.first_name"
                        :label="t('account.profile.fields.firstName.label')"
                        :rules="firstNameRules"
                        variant="outlined"
                        density="comfortable"
                        color="teal"
                        required
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model="profile.middle_name"
                        :label="t('account.profile.fields.middleName.label')"
                        :rules="middleNameRules"
                        variant="outlined"
                        density="comfortable"
                        color="teal"
                      />
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-select
                        v-model="profile.gender"
                        :label="t('account.profile.fields.gender.label')"
                        :rules="genderRules"
                        variant="outlined"
                        density="comfortable"
                        color="teal"
                        :items="genderOptions"
                        item-title="title"
                        item-value="value"
                        clearable
                      >
                        <template #append-inner>
                          <PhCaretUpDown class="dropdown-icon" />
                        </template>
                      </v-select>
                    </v-col>
                  </v-row>
                </v-col>

                <!-- Contact Information section -->
                <v-col cols="12">
                  <div class="card-header mt-6">
                    <v-card-title class="text-subtitle-1">
                      {{ t('account.profile.sections.contactInfo') }}
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
                        :label="t('account.profile.fields.phoneNumber.label')"
                        :rules="phoneRules"
                        variant="outlined"
                        density="comfortable"
                        color="teal"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="profile.email"
                        :label="t('account.profile.fields.email.label')"
                        :rules="emailRules"
                        variant="outlined"
                        density="comfortable"
                        color="teal"
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
            {{ t('account.profile.actions.title') }}
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
            {{ t('account.profile.actions.save') }}
          </v-btn>

          <!-- Change password button -->
          <v-btn
            block
            color="blue"
            variant="outlined"
            class="mb-3"
            @click="openChangePasswordModal"
          >
            {{ t('account.profile.actions.changePassword') }}
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

/* Dropdown icon positioning */
.dropdown-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}
</style>