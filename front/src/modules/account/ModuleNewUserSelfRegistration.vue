<!--
  File: ModuleNewUserSelfRegistration.vue
  Version: 1.0.0
  Description: User self-registration component for frontend
  Purpose: Provides interface for new users to register themselves with dynamic password validation
  Frontend file that manages self-registration form, integrates with password policy settings, and handles validation
  
  Features:
  - Self-registration form with all required fields
  - Dynamic password validation based on Application.Security.PasswordPolicies
  - Password confirmation field with matching validation
  - Password policies panel that shows on password field focus
  - Form validation with required field checking and password policy enforcement
  - Localization support with i18n
  - Integration with existing backend registration API
-->

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, onMounted } from 'vue'
import { useUiStore } from '@/core/state/uistate'
import { useAppStore } from '@/core/state/appstate'
import { useUserAuthStore } from '@/core/auth/state.user.auth'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import { fetchPublicPasswordPolicies } from '@/core/services/service.fetch.public.password.policies'
import { usePublicSettingsStore, type PasswordPolicies } from '@/core/state/state.public.settings'
import PasswordPoliciesPanel from '@/core/ui/panels/panel.current.password.policies.vue'
import { api } from '@/core/api/service.axios'
import { PhEye, PhEyeSlash } from '@phosphor-icons/vue'

// ==================== STORES ====================
const uiStore = useUiStore()
const appStore = useAppStore()
const userStore = useUserAuthStore()
const publicStore = usePublicSettingsStore()
const { t } = useI18n()
const {
  usernameRules,
  emailRules,
  mobilePhoneRules,
  firstNameRules,
  lastNameRules
} = useValidationRules()

// ==================== REFS & STATE ====================
/**
 * Form reference and validation state
 */
const form = ref<any>(null)
const isFormValid = ref(false)

/**
 * User registration data
 */
const user = ref({
  username: '',
  password: '',
  passwordConfirm: '',
  surname: '',  // last_name in backend
  name: '',     // first_name in backend
  email: '',
  phone: '',
  address: ''
})

/**
 * UI state variables
 */
const isSubmitting = ref(false)
const showPassword = ref(false)
const showPasswordPoliciesPanel = ref(false)

/**
 * Error state variables
 */
const invalidFields = ref<string[]>([])

// ==================== PASSWORD POLICY STATE ====================
/**
 * Password policy state using public settings store
 */
const currentPasswordPolicies = ref<PasswordPolicies | null>(null)

// ==================== REGISTRATION SETTINGS STATE ====================
/**
 * Registration page enabled/disabled state
 */
const registrationPageEnabled = ref<boolean | null>(null)
const isLoadingRegistrationSettings = ref(true)

// ==================== COMPUTED ====================
/**
 * Check if password policies are ready (loaded and valid)
 */
const passwordPoliciesReady = computed(() => {
  return !publicStore.isLoadingPasswordPolicies && 
         !publicStore.passwordPoliciesError && 
         currentPasswordPolicies.value !== null
})

/**
 * Check if registration settings are ready (loaded and valid)
 */
const registrationSettingsReady = computed(() => {
  return !isLoadingRegistrationSettings.value && 
         registrationPageEnabled.value !== null
})

/**
 * Check if registration is enabled
 */
const isRegistrationEnabled = computed(() => {
  return registrationSettingsReady.value && registrationPageEnabled.value === true
})

/**
 * Check if form should be disabled (registration disabled or settings not ready)
 */
const isFormDisabled = computed(() => {
  return !isRegistrationEnabled.value || !passwordPoliciesReady.value
})

/**
 * Dynamic password validation rules based on loaded password policies
 */
const dynamicPasswordRules = computed(() => {
  // If password policies are not loaded or there's an error, return basic rules
  if (publicStore.isLoadingPasswordPolicies || publicStore.passwordPoliciesError || !currentPasswordPolicies.value) {
    return [
              (v: string) => !!v || t('account.selfRegistration.validation.password.required'),
        () => !publicStore.passwordPoliciesError || t('account.selfRegistration.validation.password.policiesNotLoaded')
    ]
  }

  const policies = currentPasswordPolicies.value
  const rules: Array<(v: string) => string | boolean> = []
  
  // Required field rule
  rules.push((v: string) => !!v || t('account.selfRegistration.validation.password.required'))
  
  // Length rules
  rules.push((v: string) => (v && v.length >= policies.minLength) || t('account.selfRegistration.validation.password.minLength', { length: policies.minLength }))
  rules.push((v: string) => (v && v.length <= policies.maxLength) || t('account.selfRegistration.validation.password.maxLength', { length: policies.maxLength }))
  
  // Character requirements
  if (policies.requireLowercase) {
    rules.push((v: string) => /[a-z]/.test(v) || t('account.selfRegistration.validation.password.lowercase'))
  }
  
  if (policies.requireUppercase) {
    rules.push((v: string) => /[A-Z]/.test(v) || t('account.selfRegistration.validation.password.uppercase'))
  }
  
  if (policies.requireNumbers) {
    rules.push((v: string) => /[0-9]/.test(v) || t('account.selfRegistration.validation.password.numbers'))
  }
  
  if (policies.requireSpecialChars && policies.allowedSpecialChars) {
    const escapedSpecialChars = policies.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const specialCharsRegex = new RegExp(`[${escapedSpecialChars}]`)
    rules.push((v: string) => specialCharsRegex.test(v) || t('account.selfRegistration.validation.password.specialChars'))
  }
  
  // Allowed characters rule - only allowed chars
  if (policies.allowedSpecialChars) {
    const escapedSpecialChars = policies.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const allowedCharsRegex = new RegExp(`^[A-Za-z0-9${escapedSpecialChars}]+$`)
    rules.push((v: string) => allowedCharsRegex.test(v) || t('account.selfRegistration.validation.password.invalidChars'))
  }
  
  return rules
})

/**
 * Password confirmation validation rules
 */
const passwordConfirmRules = computed(() => [
  (v: string) => !!v || t('account.selfRegistration.validation.passwordConfirm.required'),
  (v: string) => v === user.value.password || t('account.selfRegistration.validation.passwordConfirm.mismatch')
])

/**
 * Address validation rules
 */
const addressRules = [
  (v: string) => !v || v.length <= 100 || t('account.selfRegistration.validation.address.maxLength'),
  (v: string) => !v || /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(v) || t('account.selfRegistration.validation.address.format')
]

/**
 * Phone validation rules
 */
const phoneRules = [
  (v: string) => !v || /^[+0-9]{0,15}$/.test(v) || t('account.selfRegistration.validation.phone.format')
]

// ==================== METHODS ====================
/**
 * Load password policy settings from public API
 */
const loadPasswordPolicies = async () => {
  try {
    
    const policies = await fetchPublicPasswordPolicies()
    currentPasswordPolicies.value = policies
    
    
    
  } catch (error) {
    
    // Error handling is done in the service layer
    // Just ensure we have some fallback value
    if (!currentPasswordPolicies.value) {
      currentPasswordPolicies.value = {
        minLength: 8,
        maxLength: 40,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
      }
    }
  }
}

/**
 * Load registration page settings from backend
 */
const loadRegistrationSettings = async () => {
  try {
    
    const response = await api.get('/api/public/registration-status')
    
    if (response.status === 200 && response.data.success) {
      registrationPageEnabled.value = response.data.enabled
      
    } else {
      
      registrationPageEnabled.value = false
    }
    
  } catch (error) {
    // Default to disabled on error
    registrationPageEnabled.value = false
  } finally {
    isLoadingRegistrationSettings.value = false
  }
}

/**
 * Toggle password visibility
 */
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

/**
 * Handle password field focus - show policies panel
 */
const onPasswordFocus = () => {
  showPasswordPoliciesPanel.value = true
}

/**
 * Handle password field blur - hide policies panel
 */
const onPasswordBlur = () => {
  showPasswordPoliciesPanel.value = false
}

/**
 * Clear all error and success messages
 */
const clearMessages = () => {
  invalidFields.value = []
}

/**
 * Submit registration form
 */
const submitForm = async () => {
  // Clear all messages first
  clearMessages()

  // Add small delay for visual effect
  await new Promise(resolve => setTimeout(resolve, 100))

  // Check if password policies are ready
  if (!passwordPoliciesReady.value) {
    uiStore.showErrorSnackbar(t('account.selfRegistration.errors.passwordPoliciesNotReady'))
    return
  }

  // Validate form
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('account.selfRegistration.errors.formValidation'))
    return
  }

  isSubmitting.value = true

  try {
    const response = await api.post('/api/admin/users/register', user.value)

    if (response.status === 200 || response.status === 201) {
      uiStore.showSuccessSnackbar(t('account.selfRegistration.success.dataSent'))
      
      // Reset form after successful registration
      user.value = {
        username: '',
        password: '',
        passwordConfirm: '',
        surname: '',
        name: '',
        email: '',
        phone: '',
        address: ''
      }
      form.value?.reset()
    } else {
      const errorData = response.data
      if (errorData.message === 'this username is already registered by another user') {
        uiStore.showErrorSnackbar(t('account.selfRegistration.errors.duplicateUsername'))
      } else if (errorData.message === 'this e-mail is already registered by another user') {
        uiStore.showErrorSnackbar(t('account.selfRegistration.errors.duplicateEmail'))
      } else if (errorData.message === 'this phone number is already registered by another user') {
        uiStore.showErrorSnackbar(t('account.selfRegistration.errors.duplicatePhone'))
      } else {
        uiStore.showErrorSnackbar(t('account.selfRegistration.errors.serverError'))
      }
    }
  } catch (error) {
    
    uiStore.showErrorSnackbar(t('account.selfRegistration.errors.networkError'))
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Navigate to login page
 */
const goToLogin = () => {
  appStore.setActiveModule('Login')
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
  await Promise.all([
    loadPasswordPolicies(),
    loadRegistrationSettings()
  ])
})
</script>

<template>
  <div class="pt-3 pl-3">
    <div style="max-width: 500px; padding-left: 24px;">
      <div
        class="text-h5"
        style="margin-bottom: 16px;"
      >
        {{ isRegistrationEnabled ? t('account.selfRegistration.title') : t('account.selfRegistration.titleDisabled') }}
      </div>
      
      <div>
        <v-form 
          ref="form"
          v-model="isFormValid"
          @submit.prevent="submitForm"
        >
          <!-- Loading indicator for registration settings -->
          <div
            v-if="isLoadingRegistrationSettings"
            class="mb-4"
          >
            <v-progress-linear
              indeterminate
              color="teal"
              height="2"
            />
            <div class="text-caption text-center mt-1">
              {{ t('account.selfRegistration.loading') }}
            </div>
          </div>
          <!-- Username field -->
          <v-text-field
            v-model="user.username"
            :label="t('account.selfRegistration.fields.username.label')"
            :rules="usernameRules"
            :disabled="isFormDisabled"
            variant="outlined"
            density="comfortable"
            counter="25"
            color="teal"
            required
          />

          <!-- Password field -->
          <v-text-field
            v-model="user.password"
            :label="t('account.selfRegistration.fields.password.label')"
            :rules="dynamicPasswordRules"
            :type="showPassword ? 'text' : 'password'"
            :counter="currentPasswordPolicies?.maxLength || 40"
            :loading="publicStore.isLoadingPasswordPolicies"
            :disabled="isFormDisabled"
            variant="outlined"
            density="comfortable"
            color="teal"
            required
            @focus="onPasswordFocus"
            @blur="onPasswordBlur"
          >
            <template #append-inner>
              <v-btn
                icon
                variant="text"
                size="small"
                :disabled="!passwordPoliciesReady"
                tabindex="-1"
                @click="togglePasswordVisibility"
              >
                <PhEyeSlash v-if="showPassword" />
                <PhEye v-else />
              </v-btn>
            </template>
          </v-text-field>

          <!-- Password confirmation field -->
          <v-text-field
            v-model="user.passwordConfirm"
            :label="t('account.selfRegistration.fields.passwordConfirm.label')"
            :rules="passwordConfirmRules"
            :type="showPassword ? 'text' : 'password'"
            :counter="currentPasswordPolicies?.maxLength || 40"
            :loading="publicStore.isLoadingPasswordPolicies"
            :disabled="isFormDisabled"
            variant="outlined"
            density="comfortable"
            color="teal"
            required
            @focus="onPasswordFocus"
            @blur="onPasswordBlur"
          />

          <!-- Password policies panel -->
          <div
            v-if="showPasswordPoliciesPanel"
            class="mb-3"
          >
            <PasswordPoliciesPanel />
          </div>

          <!-- Last name field -->
          <v-text-field
            v-model="user.surname"
            :label="t('account.selfRegistration.fields.surname.label')"
            :rules="lastNameRules"
            :disabled="isFormDisabled"
            variant="outlined"
            density="comfortable"
            counter="25"
            color="teal"
            required
          />

          <!-- First name field -->
          <v-text-field
            v-model="user.name"
            :label="t('account.selfRegistration.fields.name.label')"
            :rules="firstNameRules"
            :disabled="isFormDisabled"
            variant="outlined"
            density="comfortable"
            counter="25"
            color="teal"
            required
          />

          <!-- Email field -->
          <v-text-field
            v-model="user.email"
            :label="t('account.selfRegistration.fields.email.label')"
            :rules="emailRules"
            :disabled="isFormDisabled"
            variant="outlined"
            density="comfortable"
            type="email"
            color="teal"
            required
          />

          <!-- Phone field -->
          <v-text-field
            v-model="user.phone"
            :label="t('account.selfRegistration.fields.phone.label')"
            :placeholder="t('account.selfRegistration.fields.phone.placeholder')"
            :rules="phoneRules"
            :disabled="isFormDisabled"
            variant="outlined"
            density="comfortable"
            color="teal"
          />

          <!-- Address field -->
          <v-text-field
            v-model="user.address"
            :label="t('account.selfRegistration.fields.address.label')"
            :rules="addressRules"
            :disabled="isFormDisabled"
            variant="outlined"
            density="comfortable"
            counter="100"
            color="teal"
          />
        </v-form>

        <!-- Error messages -->
        <div
          v-if="invalidFields.length > 0"
          class="error-message mt-3"
        >
          {{ t('account.selfRegistration.errors.validation') }} {{ invalidFields.join(', ') }}
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <v-btn
          :loading="isSubmitting"
          :disabled="!isFormValid || !passwordPoliciesReady || !isRegistrationEnabled"
          color="teal"
          variant="outlined"
          @click="submitForm"
        >
          {{ t('account.selfRegistration.buttons.register') }}
        </v-btn>
      </div>

      <div class="divider" />
      
      <div class="pa-4 text-center">
        {{ t('account.selfRegistration.login.alreadyHaveAccount') }}
        <a
          href="#"
          class="register-link"
          @click.prevent="goToLogin"
        >
          {{ t('account.selfRegistration.login.signIn') }}
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-message {
  color: rgb(var(--v-theme-error));
  font-size: 0.875rem;
}

.register-link {
  color: teal;
  text-decoration: none;
}

.register-link:hover {
  text-decoration: underline;
}

.divider {
  width: calc(100% - 32px);
  height: 1px;
  background-color: #ccc;
  margin: 16px auto;
}
</style> 