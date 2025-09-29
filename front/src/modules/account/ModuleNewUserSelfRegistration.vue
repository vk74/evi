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
import { fetchPublicValidationRules } from '@/core/services/service.fetch.public.validation.rules'
import { usePublicSettingsStore, type PasswordPolicies, type ValidationRules } from '@/core/state/state.public.settings'
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
  phone: ''
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

// ==================== VALIDATION RULES STATE ====================
/**
 * Validation rules state using public settings store
 */
const currentValidationRules = ref<ValidationRules | null>(null)

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
 * Check if validation rules are ready (loaded and valid)
 */
const validationRulesReady = computed(() => {
  return !publicStore.isLoadingValidationRules && 
         !publicStore.validationRulesError && 
         currentValidationRules.value !== null
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
  return !isRegistrationEnabled.value || !passwordPoliciesReady.value || !validationRulesReady.value
})

/**
 * Dynamic password validation rules based on loaded password policies
 */
const dynamicPasswordRules = computed(() => {
  // Password policies must be loaded and valid
  if (publicStore.isLoadingPasswordPolicies || publicStore.passwordPoliciesError || !currentPasswordPolicies.value) {
    return [
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
 * Dynamic username validation rules based on loaded validation rules
 */
const dynamicUsernameRules = computed(() => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return [
      () => !publicStore.validationRulesError || t('account.selfRegistration.validation.username.rulesNotLoaded')
    ]
  }

  const rules = currentValidationRules.value.wellKnownFields.userName
  const validationRules: Array<(v: string) => string | boolean> = []
  
  // Required field rule
  validationRules.push((v: string) => !!v || t('account.selfRegistration.validation.username.required'))
  
  // Length rules
  validationRules.push((v: string) => (v && v.length >= rules.minLength) || t('account.selfRegistration.validation.username.minLength', { length: rules.minLength }))
  validationRules.push((v: string) => (v && v.length <= rules.maxLength) || t('account.selfRegistration.validation.username.maxLength', { length: rules.maxLength }))
  
  // Character requirements
  if (rules.latinOnly) {
    validationRules.push((v: string) => /^[a-zA-Z0-9._-]+$/.test(v) || t('account.selfRegistration.validation.username.latinOnly'))
  }
  
  if (!rules.allowNumbers) {
    validationRules.push((v: string) => !/[0-9]/.test(v) || t('account.selfRegistration.validation.username.noNumbers'))
  }
  
  if (!rules.allowUsernameChars) {
    validationRules.push((v: string) => !/[._-]/.test(v) || t('account.selfRegistration.validation.username.noSpecialChars'))
  }
  
  return validationRules
})

/**
 * Password confirmation validation rules
 */
const passwordConfirmRules = computed(() => [
  (v: string) => !!v || t('account.selfRegistration.validation.passwordConfirm.required'),
  (v: string) => v === user.value.password || t('account.selfRegistration.validation.passwordConfirm.mismatch')
])

/**
 */

/**
 * Dynamic email validation rules based on loaded validation rules
 */
const dynamicEmailRules = computed(() => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return [
      () => !publicStore.validationRulesError || t('account.selfRegistration.validation.email.rulesNotLoaded')
    ]
  }

  const rules = currentValidationRules.value.wellKnownFields.email
  const validationRules: Array<(v: string) => string | boolean> = []
  
  // Required field rule
  validationRules.push((v: string) => !!v || t('account.selfRegistration.validation.email.required'))
  
  // Regex validation
  try {
    const emailRegex = new RegExp(rules.regex)
    validationRules.push((v: string) => emailRegex.test(v) || t('account.selfRegistration.validation.email.format'))
  } catch (error) {
    console.error('Invalid email regex:', rules.regex, error)
    // Fallback to basic email validation
    validationRules.push((v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || t('account.selfRegistration.validation.email.format'))
  }
  
  return validationRules
})

/**
 * Dynamic phone validation rules based on loaded validation rules
 */
const dynamicPhoneRules = computed(() => {
  if (!validationRulesReady.value || !currentValidationRules.value) {
    return [
      () => !publicStore.validationRulesError || t('account.selfRegistration.validation.phone.rulesNotLoaded')
    ]
  }

  const rules = currentValidationRules.value.wellKnownFields.telephoneNumber
  const validationRules: Array<(v: string) => string | boolean> = []
  
  // Optional field, but if provided, must match regex from public policies
  if (rules.regex) {
    try {
      const phoneRegex = new RegExp(rules.regex)
      validationRules.push((v: string) => !v || phoneRegex.test(v) || t('account.selfRegistration.validation.phone.format'))
    } catch (error) {
      console.error('Invalid phone regex from public policies:', rules.regex, error)
      // No fallback - if regex is invalid, form will be disabled
      validationRules.push(() => t('account.selfRegistration.validation.phone.invalidRegex'))
    }
  }
  
  return validationRules
})

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
    // No fallback - if password policies fail, form will be disabled
  }
}

/**
 * Load validation rules from public API
 */
const loadValidationRules = async () => {
  try {
    
    const rules = await fetchPublicValidationRules()
    currentValidationRules.value = rules
    
    
    
  } catch (error) {
    
    // Error handling is done in the service layer
    // No fallback - if validation rules fail, form will be disabled
    console.error('Failed to load validation rules:', error)
  }
}

/**
 * Apply phone mask in real-time
 */
const applyPhoneMask = (value: string) => {
  if (!currentValidationRules.value?.wellKnownFields?.telephoneNumber?.mask) {
    return value
  }
  
  const mask = currentValidationRules.value.wellKnownFields.telephoneNumber.mask
  const digits = value.replace(/\D/g, '') // Remove all non-digits
  
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

/**
 * Handle phone input with real-time masking
 */
const handlePhoneInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const maskedValue = applyPhoneMask(target.value)
  user.value.phone = maskedValue
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
    loadValidationRules(),
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
            :rules="dynamicUsernameRules"
            :disabled="isFormDisabled"
            :loading="publicStore.isLoadingValidationRules"
            :counter="currentValidationRules?.wellKnownFields?.userName?.maxLength"
            variant="outlined"
            density="comfortable"
            color="teal"
            required
          />

          <!-- Password field -->
          <v-text-field
            v-model="user.password"
            :label="t('account.selfRegistration.fields.password.label')"
            :rules="dynamicPasswordRules"
            :type="showPassword ? 'text' : 'password'"
            :counter="currentPasswordPolicies?.maxLength"
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
            :counter="currentPasswordPolicies?.maxLength"
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
            :loading="publicStore.isLoadingValidationRules"
            :counter="currentValidationRules?.standardFields?.textMini?.maxLength"
            variant="outlined"
            density="comfortable"
            color="teal"
            required
          />

          <!-- First name field -->
          <v-text-field
            v-model="user.name"
            :label="t('account.selfRegistration.fields.name.label')"
            :rules="firstNameRules"
            :disabled="isFormDisabled"
            :loading="publicStore.isLoadingValidationRules"
            :counter="currentValidationRules?.standardFields?.textMini?.maxLength"
            variant="outlined"
            density="comfortable"
            color="teal"
            required
          />

          <!-- Email field -->
          <v-text-field
            v-model="user.email"
            :label="t('account.selfRegistration.fields.email.label')"
            :rules="dynamicEmailRules"
            :disabled="isFormDisabled"
            :loading="publicStore.isLoadingValidationRules"
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
            :placeholder="currentValidationRules?.wellKnownFields?.telephoneNumber?.mask || t('account.selfRegistration.fields.phone.placeholder')"
            :rules="dynamicPhoneRules"
            :disabled="isFormDisabled"
            :loading="publicStore.isLoadingValidationRules"
            @input="handlePhoneInput"
            variant="outlined"
            density="comfortable"
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

        <!-- Validation rules error -->
        <div
          v-if="publicStore.validationRulesError"
          class="text-error text-center mb-3"
        >
          <div class="mb-2">
            {{ t('account.selfRegistration.validation.rulesError') }}
          </div>
          <v-btn
            @click="loadValidationRules"
            :loading="publicStore.isLoadingValidationRules"
            color="error"
            variant="outlined"
            size="small"
          >
            {{ t('account.selfRegistration.retry') }}
          </v-btn>
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