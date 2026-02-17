<!--
  File: ModuleAccount.vue
  Version: 1.0.3
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
import { fetchUserProfile } from '@/modules/account/service.fetch.profile'
import { updateUserProfile as updateUserProfileService } from '@/modules/account/servie.update.profile'
import ChangePassword from '@/core/ui/modals/change-password/ChangePassword.vue'
import { PasswordChangeMode } from '@/core/ui/modals/change-password/types.change.password'
import { UserProfile, Gender, GenderOption } from '@/modules/account/types.user.account'
import { usePublicSettingsStore, type ValidationRules } from '@/core/state/state.public.settings'
import { fetchPublicValidationRules } from '@/core/services/service.fetch.public.validation.rules'

// ==================== STORES ====================
const userStore = useUserAuthStore()
const userAccountStore = useUserAccountStore()
const uiStore = useUiStore()
const { t } = useI18n()
const publicStore = usePublicSettingsStore()

// ==================== REFS & STATE ====================
const form = ref<any>(null)
const isFormValid = ref(false)
const isSubmitting = ref(false)
const originalProfile = ref<UserProfile | null>(null)
const currentValidationRules = ref<ValidationRules | null>(null)

const profile = ref<UserProfile>({
  last_name: '',
  first_name: '',
  middle_name: '',
  gender: '',
  mobile_phone: '',
  email: ''
})

// Phone computed with masking in setter
const phoneValue = computed({
  get: () => profile.value.mobile_phone,
  set: (value: string) => {
    profile.value.mobile_phone = applyPhoneMask(value ?? '')
  }
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
const hasChanges = computed(() => {
  if (!originalProfile.value) return false
  const a = profile.value
  const b = originalProfile.value
  return (
    a.first_name !== b.first_name ||
    a.last_name !== b.last_name ||
    a.middle_name !== b.middle_name ||
    a.gender !== b.gender ||
    a.email !== b.email ||
    a.mobile_phone !== b.mobile_phone
  )
})

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

// Dynamic rules based on public policies
const validationRulesReady = computed(() => {
  return !publicStore.validationRulesError && currentValidationRules.value !== null
})

const dynamicEmailRules = computed(() => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return [() => !publicStore.validationRulesError || t('account.selfRegistration.validation.email.rulesNotLoaded')]
  }
  const rules = currentValidationRules.value.wellKnownFields.email
  const list: Array<(v: string) => string | boolean> = []
  list.push((v: string) => !!v || t('account.profile.fields.email.validation.required'))
  try {
    const emailRegex = new RegExp(rules.regex)
    list.push((v: string) => emailRegex.test(v) || t('account.profile.fields.email.validation.format'))
  } catch (error) {
    console.error('Invalid email regex:', (rules as any).regex, error)
    list.push(() => t('account.selfRegistration.validation.email.invalidRegex'))
  }
  return list
})

const dynamicPhoneRules = computed(() => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return [() => !publicStore.validationRulesError || t('account.selfRegistration.validation.phone.rulesNotLoaded')]
  }
  const rules = currentValidationRules.value.wellKnownFields.telephoneNumber
  const list: Array<(v: string) => string | boolean> = []
  if (rules.regex) {
    try {
      const phoneRegex = new RegExp(rules.regex)
      list.push((v: string) => !v || phoneRegex.test(v) || t('account.selfRegistration.validation.phone.format'))
    } catch (error) {
      console.error('Invalid phone regex from public policies:', rules.regex, error)
      list.push(() => t('account.selfRegistration.validation.phone.invalidRegex'))
    }
  }
  return list
})


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
      // Build payload with only changed fields
      const changed: Partial<UserProfile> = {}
      const current = profile.value
      const original = originalProfile.value
      if (original) {
        if (current.first_name !== original.first_name) changed.first_name = current.first_name
        if (current.last_name !== original.last_name) changed.last_name = current.last_name
        if (current.middle_name !== original.middle_name) changed.middle_name = current.middle_name
        if (current.gender !== original.gender) changed.gender = current.gender
        if (current.email !== original.email) changed.email = current.email
        if (current.mobile_phone !== original.mobile_phone) changed.mobile_phone = current.mobile_phone
      } else {
        Object.assign(changed, current)
      }

      // Normalize phone for API if present in changed
      if (typeof changed.mobile_phone === 'string') {
        const trimmed = changed.mobile_phone.trim()
        if (trimmed === '') {
          // send null to clear the phone and satisfy DB check constraint
          changed.mobile_phone = null as unknown as any
        } else {
          const hasPlus = /^\s*\+/.test(trimmed)
          const normalized = hasPlus ? `+${trimmed.replace(/\D/g, '')}` : trimmed.replace(/\D/g, '')
          changed.mobile_phone = normalized as unknown as any
        }
      }

      console.log('sending request to update user profile data (changed only):', changed)
      await updateUserProfileService(changed as any)
      console.log('Profile updated successfully')
      uiStore.showSuccessSnackbar(t('account.profile.messages.saveSuccess'))
      // Update profile in account store
      userAccountStore.updateProfile(current)
      // Sync original after successful save
      originalProfile.value = { ...current }
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
      const data = await fetchUserProfile()
      profile.value = data
      // Apply phone mask if public policies are available
      if (validationRulesReady.value && profile.value.mobile_phone) {
        profile.value.mobile_phone = applyPhoneMask(String(profile.value.mobile_phone))
      }
      // Update profile in account store
      userAccountStore.updateProfile(profile.value)
      // Store original snapshot
      originalProfile.value = { ...profile.value }
    } catch (error) {
      console.error('Error on load of user profile data:', error)
      uiStore.showErrorSnackbar(t('account.profile.messages.loadError'))
    }
  }
}

// ==================== LIFECYCLE ====================
// Helpers for phone mask
const applyPhoneMask = (value: string | null | undefined) => {
  if (value == null) return ''
  if (!currentValidationRules.value?.wellKnownFields?.telephoneNumber?.mask) return value
  const mask = currentValidationRules.value.wellKnownFields.telephoneNumber.mask
  let digits = value.replace(/\D/g, '')
  let maskIndex = 0
  let digitIndexForSkip = 0
  while (maskIndex < mask.length && digitIndexForSkip < digits.length) {
    const maskChar = mask[maskIndex]
    const inputDigit = digits[digitIndexForSkip]
    if (maskChar === '#') break
    if (/\d/.test(maskChar)) {
      if (maskChar === inputDigit) {
        digitIndexForSkip++
      }
    }
    maskIndex++
  }
  if (digitIndexForSkip > 0) digits = digits.slice(digitIndexForSkip)
  let maskedValue = ''
  let digitIndex = 0
  for (let i = 0; i < mask.length && digitIndex < digits.length; i++) {
    if (mask[i] === '#') {
      maskedValue += digits[digitIndex]
      digitIndex++
    } else {
      maskedValue += mask[i]
    }
  }
  return maskedValue
}

onMounted(async () => {
  // load public validation rules first so that mask is available
  try {
    const rules = await fetchPublicValidationRules()
    currentValidationRules.value = rules
  } catch (e) {
    console.error('Failed to load public validation rules in ModuleAccount.vue', e)
  }
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
                      />
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
                        v-model="phoneValue"
                        :placeholder="currentValidationRules?.wellKnownFields?.telephoneNumber?.mask || t('account.selfRegistration.fields.phone.placeholder')"
                        :rules="dynamicPhoneRules"
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
                        :rules="dynamicEmailRules"
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
          
          <!-- Update button -->
          <v-btn
            block
            color="teal"
            variant="outlined"
            :disabled="!isFormValid || isSubmitting || !hasChanges"
            :class="['mb-3', { 'update-btn-glow': hasChanges && isFormValid && !isSubmitting }]"
            @click="saveProfile"
          >
            {{ t('account.profile.actions.update') }}
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

/* Update button glow animation for unsaved changes */
.update-btn-glow {
  animation: soft-glow 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
}

@keyframes soft-glow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(20, 184, 166, 0.3);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 16px rgba(20, 184, 166, 0.5);
    transform: scale(1.01);
  }
}
</style>