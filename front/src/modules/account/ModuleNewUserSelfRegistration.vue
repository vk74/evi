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
import { useUserStore } from '@/core/state/userstate'
import { useValidationRules } from '@/core/validation/rules.common.fields'
import { fetchPublicPasswordPolicies } from '@/core/services/service.fetch.public.password.policies'
import { usePublicSettingsStore, type PasswordPolicies } from '@/core/state/state.public.settings'
import PasswordPoliciesPanel from '@/core/ui/panels/panel.current.password.policies.vue'

// ==================== STORES ====================
const uiStore = useUiStore()
const userStore = useUserStore()
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
 * Dynamic password validation rules based on loaded password policies
 */
const dynamicPasswordRules = computed(() => {
  // If password policies are not loaded or there's an error, return basic rules
  if (publicStore.isLoadingPasswordPolicies || publicStore.passwordPoliciesError || !currentPasswordPolicies.value) {
    return [
      (v: string) => !!v || t('selfRegistration.validation.password.required'),
      () => !publicStore.passwordPoliciesError || t('selfRegistration.validation.password.policiesNotLoaded')
    ]
  }

  const policies = currentPasswordPolicies.value
  const rules: Array<(v: string) => string | boolean> = []
  
  // Required field rule
  rules.push((v: string) => !!v || t('selfRegistration.validation.password.required'))
  
  // Length rules
  rules.push((v: string) => (v && v.length >= policies.minLength) || t('selfRegistration.validation.password.minLength', { length: policies.minLength }))
  rules.push((v: string) => (v && v.length <= policies.maxLength) || t('selfRegistration.validation.password.maxLength', { length: policies.maxLength }))
  
  // Character requirements
  if (policies.requireLowercase) {
    rules.push((v: string) => /[a-z]/.test(v) || t('selfRegistration.validation.password.lowercase'))
  }
  
  if (policies.requireUppercase) {
    rules.push((v: string) => /[A-Z]/.test(v) || t('selfRegistration.validation.password.uppercase'))
  }
  
  if (policies.requireNumbers) {
    rules.push((v: string) => /[0-9]/.test(v) || t('selfRegistration.validation.password.numbers'))
  }
  
  if (policies.requireSpecialChars && policies.allowedSpecialChars) {
    const escapedSpecialChars = policies.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const specialCharsRegex = new RegExp(`[${escapedSpecialChars}]`)
    rules.push((v: string) => specialCharsRegex.test(v) || t('selfRegistration.validation.password.specialChars'))
  }
  
  // Allowed characters rule - only allowed chars
  if (policies.allowedSpecialChars) {
    const escapedSpecialChars = policies.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const allowedCharsRegex = new RegExp(`^[A-Za-z0-9${escapedSpecialChars}]+$`)
    rules.push((v: string) => allowedCharsRegex.test(v) || t('selfRegistration.validation.password.invalidChars'))
  }
  
  return rules
})

/**
 * Password confirmation validation rules
 */
const passwordConfirmRules = computed(() => [
  (v: string) => !!v || t('selfRegistration.validation.passwordConfirm.required'),
  (v: string) => v === user.value.password || t('selfRegistration.validation.passwordConfirm.mismatch')
])

/**
 * Address validation rules
 */
const addressRules = [
  (v: string) => !v || v.length <= 100 || t('selfRegistration.validation.address.maxLength'),
  (v: string) => !v || /^[\p{L}\p{N}\p{P}\p{Z}]+$/u.test(v) || t('selfRegistration.validation.address.format')
]

/**
 * Phone validation rules
 */
const phoneRules = [
  (v: string) => !v || /^[+0-9]{0,15}$/.test(v) || t('selfRegistration.validation.phone.format')
]

// ==================== METHODS ====================
/**
 * Load password policy settings from public API
 */
const loadPasswordPolicies = async () => {
  try {
    console.log('Loading password policy settings for self-registration')
    
    const policies = await fetchPublicPasswordPolicies()
    currentPasswordPolicies.value = policies
    
    console.log('Password policies loaded successfully:', policies)
    
  } catch (error) {
    console.error('Error loading password policies:', error)
    
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
    uiStore.showErrorSnackbar(t('selfRegistration.errors.passwordPoliciesNotReady'))
    return
  }

  // Validate form
  if (!form.value?.validate()) {
    uiStore.showErrorSnackbar(t('selfRegistration.errors.formValidation'))
    return
  }

  isSubmitting.value = true

  try {
    const response = await fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user.value)
    })

    if (response.ok) {
      console.log('User self-registration data successfully sent to backend server')
      uiStore.showSuccessSnackbar(t('selfRegistration.success.dataSent'))
      
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
      const errorData = await response.json()
      if (errorData.message === 'this username is already registered by another user') {
        uiStore.showErrorSnackbar(t('selfRegistration.errors.duplicateUsername'))
      } else if (errorData.message === 'this e-mail is already registered by another user') {
        uiStore.showErrorSnackbar(t('selfRegistration.errors.duplicateEmail'))
      } else if (errorData.message === 'this phone number is already registered by another user') {
        uiStore.showErrorSnackbar(t('selfRegistration.errors.duplicatePhone'))
      } else {
        console.error('Error on sending registration data to backend:', response.status, response.statusText)
        uiStore.showErrorSnackbar(t('selfRegistration.errors.serverError'))
      }
    }
  } catch (error) {
    console.error('Error on sending registration data to backend:', error)
    uiStore.showErrorSnackbar(t('selfRegistration.errors.networkError'))
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Navigate to login page
 */
const goToLogin = () => {
  userStore.activeModule = 'Login'
}

// ==================== LIFECYCLE ====================
onMounted(async () => {
  console.log('ModuleNewUserSelfRegistration mounted')
  await loadPasswordPolicies()
})
</script>

<template>
  <div class="pt-3 pl-3">
    <v-card max-width="500px">
      <v-card-title class="text-h5">
        {{ t('selfRegistration.title') }}
      </v-card-title>
      
      <v-card-text>
        <v-form 
          ref="form"
          v-model="isFormValid"
          @submit.prevent="submitForm"
        >
          <!-- Username field -->
          <v-text-field
            v-model="user.username"
            :label="t('selfRegistration.fields.username.label')"
            :rules="usernameRules"
            variant="outlined"
            density="comfortable"
            counter="25"
            required
          />

          <!-- Password field -->
          <v-text-field
            v-model="user.password"
            :label="t('selfRegistration.fields.password.label')"
            :rules="dynamicPasswordRules"
            :type="showPassword ? 'text' : 'password'"
            :counter="currentPasswordPolicies?.maxLength || 40"
            :loading="publicStore.isLoadingPasswordPolicies"
            :disabled="!passwordPoliciesReady"
            variant="outlined"
            density="comfortable"
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
                @click="togglePasswordVisibility"
                tabindex="-1"
              >
                <v-icon>
                  {{ showPassword ? 'mdi-eye-off' : 'mdi-eye' }}
                </v-icon>
              </v-btn>
            </template>
          </v-text-field>

          <!-- Password confirmation field -->
          <v-text-field
            v-model="user.passwordConfirm"
            :label="t('selfRegistration.fields.passwordConfirm.label')"
            :rules="passwordConfirmRules"
            :type="showPassword ? 'text' : 'password'"
            :counter="currentPasswordPolicies?.maxLength || 40"
            :loading="publicStore.isLoadingPasswordPolicies"
            :disabled="!passwordPoliciesReady"
            variant="outlined"
            density="comfortable"
            required
            @focus="onPasswordFocus"
            @blur="onPasswordBlur"
          />

          <!-- Password policies panel -->
          <div v-if="showPasswordPoliciesPanel" class="mb-3">
            <PasswordPoliciesPanel />
          </div>

          <!-- Last name field -->
          <v-text-field
            v-model="user.surname"
            :label="t('selfRegistration.fields.surname.label')"
            :rules="lastNameRules"
            variant="outlined"
            density="comfortable"
            counter="25"
            required
          />

          <!-- First name field -->
          <v-text-field
            v-model="user.name"
            :label="t('selfRegistration.fields.name.label')"
            :rules="firstNameRules"
            variant="outlined"
            density="comfortable"
            counter="25"
            required
          />

          <!-- Email field -->
          <v-text-field
            v-model="user.email"
            :label="t('selfRegistration.fields.email.label')"
            :rules="emailRules"
            variant="outlined"
            density="comfortable"
            type="email"
            required
          />

          <!-- Phone field -->
          <v-text-field
            v-model="user.phone"
            :label="t('selfRegistration.fields.phone.label')"
            :placeholder="t('selfRegistration.fields.phone.placeholder')"
            :rules="phoneRules"
            variant="outlined"
            density="comfortable"
          />

          <!-- Address field -->
          <v-text-field
            v-model="user.address"
            :label="t('selfRegistration.fields.address.label')"
            :rules="addressRules"
            variant="outlined"
            density="comfortable"
            counter="100"
          />
        </v-form>

        <!-- Error messages -->
        <div v-if="invalidFields.length > 0" class="error-message mt-3">
          {{ t('selfRegistration.errors.validation') }} {{ invalidFields.join(', ') }}
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          :loading="isSubmitting"
          :disabled="!isFormValid || !passwordPoliciesReady"
          color="teal darken-1"
          variant="outlined"
          @click="submitForm"
        >
          {{ t('selfRegistration.buttons.register') }}
        </v-btn>
      </v-card-actions>

      <v-divider class="mx-4" />
      
      <div class="pa-4 text-center">
        {{ t('selfRegistration.login.alreadyHaveAccount') }}
        <a
          href="#"
          class="register-link"
          @click.prevent="goToLogin"
        >
          {{ t('selfRegistration.login.signIn') }}
        </a>
      </div>
    </v-card>
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
</style> 