/**
 * File: ChangePassword.vue
 * Version: 1.2.0
 * Description: Universal password change component for frontend
 * Purpose: Works in both self and admin modes with dynamic password policy validation
 * Frontend file that manages password change modals, integrates with password policy settings, and handles validation
 * 
 * Features:
 * - Works as a modal dialog
 * - Supports self password change (requires current password)
 * - Supports admin password reset
 * - Validates password according to dynamic system policies from Application.Security.PasswordPolicies
 * - Provides password visibility toggle and example password generation
 * - Shows current password requirements and policy information
 * - Logs comprehensive information about operations
 */

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUiStore } from '@/core/state/uistate';
import { useUserAuthStore } from '@/core/auth/state.user.auth';
import { ChangePasswordProps, PasswordChangeMode } from './types.change.password';
import changePassword from './service.self.change.password';
import resetPassword from './service.admin.change.password';
import { fetchSettings } from '@/modules/admin/settings/service.fetch.settings';
import PasswordPoliciesPanel from '@/core/ui/panels/panel.current.password.policies.vue';

// Init i18n and stores
const { t } = useI18n();
const uiStore = useUiStore();
const userStore = useUserAuthStore();

// Component props
const props = defineProps<ChangePasswordProps>();

// Form refs and validation
const form = ref<HTMLFormElement | null>(null);
const newPasswordRef = ref<any>(null);

// Form state
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const currentPasswordError = ref('');
const newPasswordError = ref('');
const confirmPasswordError = ref('');
const loading = ref(false);

// Password visibility states
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// ==================== PASSWORD POLICY STATE (FOR VALIDATION) ====================
/**
 * Password policy loading state and settings for validation purposes
 */
const isLoadingPasswordPolicies = ref(true)
const passwordPolicyError = ref(false)
const passwordMinLength = ref<number | null>(null)
const passwordMaxLength = ref<number | null>(null)
const requireLowercase = ref<boolean | null>(null)
const requireUppercase = ref<boolean | null>(null)
const requireNumbers = ref<boolean | null>(null)
const requireSpecialChars = ref<boolean | null>(null)
const allowedSpecialChars = ref<string | null>(null)

// ==================== DYNAMIC PASSWORD VALIDATION ====================
/**
 * Dynamic password validation rules based on loaded password policies
 */
const dynamicPasswordRules = computed(() => {
  // If password policies are not loaded or there's an error, return blocking rules
  if (isLoadingPasswordPolicies.value || passwordPolicyError.value || 
      passwordMinLength.value === null || passwordMaxLength.value === null ||
      requireLowercase.value === null || requireUppercase.value === null ||
      requireNumbers.value === null || requireSpecialChars.value === null ||
      allowedSpecialChars.value === null) {
    return [
      (v: string) => !!v || 'пароль обязателен',
      () => !passwordPolicyError.value || 'настройки политики паролей не загружены - смена пароля заблокирована'
    ]
  }

  const rules: Array<(v: string) => string | boolean> = []
  
  // Required field rule
  rules.push((v: string) => !!v || 'пароль обязателен')
  
  // Length rules
  rules.push((v: string) => (v && v.length >= passwordMinLength.value!) || `пароль должен содержать минимум ${passwordMinLength.value} символов`)
  rules.push((v: string) => (v && v.length <= passwordMaxLength.value!) || `пароль не должен превышать ${passwordMaxLength.value} символов`)
  
  // Character requirements
  if (requireLowercase.value) {
    rules.push((v: string) => /[a-z]/.test(v) || 'пароль должен содержать строчные буквы')
  }
  
  if (requireUppercase.value) {
    rules.push((v: string) => /[A-Z]/.test(v) || 'пароль должен содержать заглавные буквы')
  }
  
  if (requireNumbers.value) {
    rules.push((v: string) => /[0-9]/.test(v) || 'пароль должен содержать цифры')
  }
  
  if (requireSpecialChars.value && allowedSpecialChars.value) {
    const escapedSpecialChars = allowedSpecialChars.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const specialCharsRegex = new RegExp(`[${escapedSpecialChars}]`)
    rules.push((v: string) => specialCharsRegex.test(v) || 'пароль должен содержать специальные символы')
  }
  
  // Allowed characters rule - only allowed chars
  if (allowedSpecialChars.value) {
    const escapedSpecialChars = allowedSpecialChars.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const allowedCharsRegex = new RegExp(`^[A-Za-z0-9${escapedSpecialChars}]+$`)
    rules.push((v: string) => allowedCharsRegex.test(v) || 'пароль содержит недопустимые символы')
  }
  
  return rules
})



/**
 * Check if password policies are ready (loaded and valid)
 */
const passwordPoliciesReady = computed(() => {
  return !isLoadingPasswordPolicies.value && !passwordPolicyError.value &&
         passwordMinLength.value !== null && passwordMaxLength.value !== null &&
         requireLowercase.value !== null && requireUppercase.value !== null &&
         requireNumbers.value !== null && requireSpecialChars.value !== null &&
         allowedSpecialChars.value !== null
})

// ==================== PASSWORD POLICY METHODS (FOR VALIDATION) ====================
/**
 * Load password policy settings from backend for validation purposes
 */
const loadPasswordPolicies = async () => {
  isLoadingPasswordPolicies.value = true
  passwordPolicyError.value = false
  
  try {
    console.log('[ChangePassword] Loading password policy settings for validation')
    
    const settings = await fetchSettings('Application.Security.PasswordPolicies')
    
    if (settings && settings.length > 0) {
      // Extract settings by name
      const settingsMap = new Map(settings.map(s => [s.setting_name, s.value]))
      
      passwordMinLength.value = Number(settingsMap.get('password.min.length') ?? 8)
      passwordMaxLength.value = Number(settingsMap.get('password.max.length') ?? 40)
      requireLowercase.value = Boolean(settingsMap.get('password.require.lowercase') ?? true)
      requireUppercase.value = Boolean(settingsMap.get('password.require.uppercase') ?? true)
      requireNumbers.value = Boolean(settingsMap.get('password.require.numbers') ?? true)
      requireSpecialChars.value = Boolean(settingsMap.get('password.require.special.chars') ?? false)
      allowedSpecialChars.value = String(settingsMap.get('password.allowed.special.chars') ?? '!@#$%^&*()_+-=[]{}|;:,.<>?')
      
      console.log('[ChangePassword] Password policies loaded successfully for validation:', {
        minLength: passwordMinLength.value,
        maxLength: passwordMaxLength.value,
        requireLowercase: requireLowercase.value,
        requireUppercase: requireUppercase.value,
        requireNumbers: requireNumbers.value,
        requireSpecialChars: requireSpecialChars.value,
        allowedSpecialChars: allowedSpecialChars.value
      })
    } else {
      throw new Error('No password policy settings found')
    }
  } catch (error) {
    console.error('[ChangePassword] Failed to load password policies for validation:', error)
    passwordPolicyError.value = true
    uiStore.showErrorSnackbar('ошибка загрузки настроек политики паролей - смена пароля заблокирована')
  } finally {
    isLoadingPasswordPolicies.value = false
  }
}

/**
 * Validates that the confirmed password matches the new password
 */
const validatePasswordMatch = () => {
  if (confirmPassword.value && newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = t('passwordChange.passwordsDoNotMatch');
  } else {
    confirmPasswordError.value = '';
  }
};

/**
 * Resets the form fields and errors
 */
const resetForm = () => {
  console.log('[ChangePassword] Resetting form fields');
  currentPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  currentPasswordError.value = '';
  newPasswordError.value = '';
  confirmPasswordError.value = '';
  
  if (form.value) {
    form.value.resetValidation();
  }
};

/**
 * Closes the modal dialog
 */
const closeModal = () => {
  console.log('[ChangePassword] Closing modal');
  props.onClose();
};

/**
 * Validates form before submission
 * @returns {boolean} True if validation passes, false otherwise
 */
const validateForm = (): boolean => {
  // Check if password policies are ready
  if (!passwordPoliciesReady.value) {
    uiStore.showErrorSnackbar('настройки политики паролей не загружены - смена пароля заблокирована');
    return false;
  }
  
  // Reset error messages
  currentPasswordError.value = '';
  newPasswordError.value = '';
  confirmPasswordError.value = '';
  
  // Validate fields based on mode
  if (props.mode === PasswordChangeMode.SELF && !currentPassword.value) {
    currentPasswordError.value = t('passwordChange.currentPasswordRequired');
    return false;
  }
  
  if (!newPassword.value) {
    newPasswordError.value = t('validation.password.required');
    return false;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = t('passwordChange.passwordsDoNotMatch');
    return false;
  }
  
  // Run dynamic validation rules for password
  for (const rule of dynamicPasswordRules.value) {
    const result = rule(newPassword.value);
    if (result !== true) {
      newPasswordError.value = result as string;
      return false;
    }
  }
  
  return true;
};

/**
 * Submits the form with appropriate service based on mode
 */
const submitForm = async () => {
  console.log(`[ChangePassword] Submitting form in ${props.mode} mode for user ${props.username} (${props.uuid})`);
  console.log(`[ChangePassword] Current admin user: ${userStore.username} (${userStore.userID})`);
  
  if (!validateForm()) {
    console.log('[ChangePassword] Form validation failed');
    return;
  }
  
  loading.value = true;
  
  try {
    let response;
    
    if (props.mode === PasswordChangeMode.SELF) {
      // Self change password
      const selfData = {
        uuid: props.uuid,
        username: props.username,
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      };
      console.log('[ChangePassword] Self mode data:', JSON.stringify({
        uuid: selfData.uuid || 'missing',
        username: selfData.username || 'missing',
        currentPassword: selfData.currentPassword ? '[REDACTED]' : 'missing',
        newPassword: selfData.newPassword ? '[REDACTED]' : 'missing'
      }));
      response = await changePassword(selfData);
    } else {
      // Admin reset password
      const adminData = {
        uuid: props.uuid,
        username: props.username,
        newPassword: newPassword.value
      };
      console.log('[ChangePassword] Admin mode data:', JSON.stringify({
        uuid: adminData.uuid || 'missing',
        username: adminData.username || 'missing',
        newPassword: adminData.newPassword ? '[REDACTED]' : 'missing'
      }));
      response = await resetPassword(adminData);
    }
    
    if (response.success) {
      uiStore.showSuccessSnackbar(response.message || t('passwordChange.success'));
      setTimeout(() => {
        closeModal();
      }, 300);
    } else {
      uiStore.showErrorSnackbar(response.message || t('passwordChange.error'));
    }
  } catch (error) {
    console.error('[ChangePassword] Error during password change:', error);
    uiStore.showErrorSnackbar(t('passwordChange.unexpectedError'));
  } finally {
    loading.value = false;
  }
};

// Initialize form on mount
onMounted(async () => {
  console.log(`[ChangePassword] Mounted in ${props.mode} mode for user ${props.username} (${props.uuid})`);
  console.log(`[ChangePassword] Current admin user: ${userStore.username} (${userStore.userID})`);
  
  // Verify all props are present
  if (!props.title) console.warn('[ChangePassword] Missing prop: title');
  if (!props.uuid) console.warn('[ChangePassword] Missing prop: uuid');
  if (!props.username) console.warn('[ChangePassword] Missing prop: username');
  if (!props.mode) console.warn('[ChangePassword] Missing prop: mode');
  if (!props.onClose) console.warn('[ChangePassword] Missing prop: onClose');
  
  // Load password policies for all modes
  await loadPasswordPolicies();
  
  // Установка фокуса на поле нового пароля после рендера компонента
  setTimeout(() => {
    if (newPasswordRef.value?.$el.querySelector('input')) {
      newPasswordRef.value.$el.querySelector('input').focus();
    }
  }, 100);
});
</script>

<template>
  <div
    class="modal-overlay"
    @click.self="closeModal"
  >
    <div class="modal">
      <v-card>
        <v-card-title class="text-h7">
          {{ title }}
        </v-card-title>
        
        <v-card-text>
          <v-form
            ref="form"
            @submit.prevent="submitForm"
            @keyup.enter="submitForm"
          >
            <!-- Current password field (only for self mode) -->
            <v-text-field
              v-if="mode === PasswordChangeMode.SELF"
              v-model="currentPassword"
              :label="$t('passwordChange.currentPassword')"
              :type="showCurrentPassword ? 'text' : 'password'"
              :append-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :error-messages="currentPasswordError ? [currentPasswordError] : []"
              outlined
              dense
              class="mb-3"
              tabindex="1"
              @click:append="showCurrentPassword = !showCurrentPassword"
              @keyup.enter="submitForm"
            />
            
            <!-- New password field -->
            <v-text-field
              ref="newPasswordRef"
              v-model="newPassword"
              :label="$t('passwordChange.newPassword')"
              :type="showNewPassword ? 'text' : 'password'"
              :append-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :error-messages="newPasswordError ? [newPasswordError] : []"
              :counter="passwordMaxLength || 40"
              :loading="isLoadingPasswordPolicies"
              :disabled="!passwordPoliciesReady"
              outlined
              dense
              class="mb-3"
              tabindex="2"
              @click:append="showNewPassword = !showNewPassword"
              @input="validatePasswordMatch"
              @keyup.enter="submitForm"
            />
            
            <!-- Confirm password field -->
            <v-text-field
              v-model="confirmPassword"
              :label="$t('passwordChange.confirmPassword')"
              :type="showConfirmPassword ? 'text' : 'password'"
              :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :error-messages="confirmPasswordError ? [confirmPasswordError] : []"
              :counter="passwordMaxLength || 40"
              :loading="isLoadingPasswordPolicies"
              :disabled="!passwordPoliciesReady"
              outlined
              dense
              class="mb-3"
              tabindex="3"
              @click:append="showConfirmPassword = !showConfirmPassword"
              @input="validatePasswordMatch"
              @keyup.enter="submitForm"
            />
            
            <!-- Password policy information panel -->
            <PasswordPoliciesPanel class="mt-2" />
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="grey"
            variant="outlined"
            class="mr-2"
            :disabled="!passwordPoliciesReady"
            tabindex="5"
            @click="resetForm"
          >
            {{ $t('passwordChange.reset') }}
          </v-btn>
          <v-btn
            color="teal"
            variant="outlined"
            :loading="loading"
            :disabled="!passwordPoliciesReady"
            tabindex="4"
            @click="submitForm"
          >
            {{ mode === PasswordChangeMode.SELF 
              ? $t('passwordChange.change') 
              : $t('passwordChange.resetPassword') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  max-width: 550px;
  width: 100%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: auto;
  z-index: 1001;
}
</style>