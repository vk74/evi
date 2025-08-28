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
 * - Validates password according to dynamic system policies from public password policies API
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
import { fetchPublicPasswordPolicies } from '@/core/services/service.fetch.public.password.policies';
import { usePublicSettingsStore, type PasswordPolicies } from '@/core/state/state.public.settings';
import PasswordPoliciesPanel from '@/core/ui/panels/panel.current.password.policies.vue';
import PhIcon from '@/core/ui/icons/PhIcon.vue';

// Init i18n and stores
const { t } = useI18n();
const uiStore = useUiStore();
const userStore = useUserAuthStore();
const publicStore = usePublicSettingsStore();

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
const currentPasswordPolicies = ref<PasswordPolicies | null>(null)

// ==================== DYNAMIC PASSWORD VALIDATION ====================
/**
 * Dynamic password validation rules based on loaded password policies
 */
const dynamicPasswordRules = computed(() => {
  // If password policies are not loaded or there's an error, return blocking rules
  if (isLoadingPasswordPolicies.value || passwordPolicyError.value || !currentPasswordPolicies.value) {
    return [
      (v: string) => !!v || 'пароль обязателен',
      () => !passwordPolicyError.value || 'настройки политики паролей не загружены - смена пароля заблокирована'
    ]
  }

  const policies = currentPasswordPolicies.value;
  const rules: Array<(v: string) => string | boolean> = []
  
  // Required field rule
  rules.push((v: string) => !!v || 'пароль обязателен')
  
  // Length rules
  rules.push((v: string) => (v && v.length >= policies.minLength) || `пароль должен содержать минимум ${policies.minLength} символов`)
  rules.push((v: string) => (v && v.length <= policies.maxLength) || `пароль не должен превышать ${policies.maxLength} символов`)
  
  // Character requirements
  if (policies.requireLowercase) {
    rules.push((v: string) => /[a-z]/.test(v) || 'пароль должен содержать строчные буквы')
  }
  
  if (policies.requireUppercase) {
    rules.push((v: string) => /[A-Z]/.test(v) || 'пароль должен содержать заглавные буквы')
  }
  
  if (policies.requireNumbers) {
    rules.push((v: string) => /[0-9]/.test(v) || 'пароль должен содержать цифры')
  }
  
  if (policies.requireSpecialChars && policies.allowedSpecialChars) {
    const escapedSpecialChars = policies.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const specialCharsRegex = new RegExp(`[${escapedSpecialChars}]`)
    rules.push((v: string) => specialCharsRegex.test(v) || 'пароль должен содержать специальные символы')
  }
  
  // Allowed characters rule - only allowed chars
  if (policies.allowedSpecialChars) {
    const escapedSpecialChars = policies.allowedSpecialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const allowedCharsRegex = new RegExp(`^[A-Za-z0-9${escapedSpecialChars}]+$`)
    rules.push((v: string) => allowedCharsRegex.test(v) || 'пароль содержит недопустимые символы')
  }
  
  return rules
})

/**
 * Check if password policies are ready (loaded and valid)
 */
const passwordPoliciesReady = computed(() => {
  return !isLoadingPasswordPolicies.value && !passwordPolicyError.value && currentPasswordPolicies.value !== null
})

// ==================== PASSWORD POLICY METHODS (FOR VALIDATION) ====================
/**
 * Load password policy settings from public API for validation purposes
 */
const loadPasswordPolicies = async () => {
  isLoadingPasswordPolicies.value = true
  passwordPolicyError.value = false
  
  try {
    
    // Use public API instead of admin settings API for consistency and efficiency
    const policies = await fetchPublicPasswordPolicies()
    currentPasswordPolicies.value = policies
    
    
    
  } catch (error) {
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
  
  
  if (!validateForm()) {
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
      response = await changePassword(selfData);
    } else {
      // Admin reset password
      const adminData = {
        uuid: props.uuid,
        username: props.username,
        newPassword: newPassword.value
      };
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
    uiStore.showErrorSnackbar(t('passwordChange.unexpectedError'));
  } finally {
    loading.value = false;
  }
};

// Initialize form on mount
onMounted(async () => {
  
  // Verify all props are present
  
  
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
              :error-messages="currentPasswordError ? [currentPasswordError] : []"
              outlined
              dense
              class="mb-3"
              tabindex="1"
              @keyup.enter="submitForm"
            >
              <template #append-inner>
                <div
                  class="d-flex align-center"
                  style="cursor: pointer"
                  @click="showCurrentPassword = !showCurrentPassword"
                >
                  <PhIcon :name="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'" />
                </div>
              </template>
            </v-text-field>
            
            <!-- New password field -->
            <v-text-field
              ref="newPasswordRef"
              v-model="newPassword"
              :label="$t('passwordChange.newPassword')"
              :type="showNewPassword ? 'text' : 'password'"
              :error-messages="newPasswordError ? [newPasswordError] : []"
              :counter="currentPasswordPolicies?.maxLength || 40"
              :loading="isLoadingPasswordPolicies"
              :disabled="!passwordPoliciesReady"
              outlined
              dense
              class="mb-3"
              tabindex="2"
              @input="validatePasswordMatch"
              @keyup.enter="submitForm"
            >
              <template #append-inner>
                <div
                  class="d-flex align-center"
                  style="cursor: pointer"
                  @click="showNewPassword = !showNewPassword"
                >
                  <PhIcon :name="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'" />
                </div>
              </template>
            </v-text-field>
            
            <!-- Confirm password field -->
            <v-text-field
              v-model="confirmPassword"
              :label="$t('passwordChange.confirmPassword')"
              :type="showConfirmPassword ? 'text' : 'password'"
              :error-messages="confirmPasswordError ? [confirmPasswordError] : []"
              :counter="currentPasswordPolicies?.maxLength || 40"
              :loading="isLoadingPasswordPolicies"
              :disabled="!passwordPoliciesReady"
              outlined
              dense
              class="mb-3"
              tabindex="3"
              @input="validatePasswordMatch"
              @keyup.enter="submitForm"
            >
              <template #append-inner>
                <div
                  class="d-flex align-center"
                  style="cursor: pointer"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <PhIcon :name="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'" />
                </div>
              </template>
            </v-text-field>
            
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