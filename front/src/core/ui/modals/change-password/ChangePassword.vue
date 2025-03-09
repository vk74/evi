/**
 * ChangePassword.vue
 * Universal password change component that works in both self and admin modes.
 * 
 * Features:
 * - Works as a modal dialog
 * - Supports self password change (requires current password)
 * - Supports admin password reset
 * - Validates password according to system rules
 * - Provides password visibility toggle
 */
<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal">
      <v-card>
        <v-card-title class="text-h7">
          {{ title }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="form" @submit.prevent="submitForm">
            <!-- Current password field (only for self mode) -->
            <v-text-field
              v-if="mode === PasswordChangeMode.SELF"
              v-model="currentPassword"
              :label="$t('passwordChange.currentPassword')"
              :type="showCurrentPassword ? 'text' : 'password'"
              :append-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :error-messages="currentPasswordError ? [currentPasswordError] : []"
              @click:append="showCurrentPassword = !showCurrentPassword"
              outlined
              dense
              class="mb-3"
            ></v-text-field>
            
            <!-- New password field -->
            <v-text-field
              v-model="newPassword"
              :label="$t('passwordChange.newPassword')"
              :type="showNewPassword ? 'text' : 'password'"
              :append-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :error-messages="newPasswordError ? [newPasswordError] : []"
              @click:append="showNewPassword = !showNewPassword"
              @input="validatePasswordMatch"
              outlined
              dense
              class="mb-3"
            ></v-text-field>
            
            <!-- Confirm password field -->
            <v-text-field
              v-model="confirmPassword"
              :label="$t('passwordChange.confirmPassword')"
              :type="showConfirmPassword ? 'text' : 'password'"
              :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
              :error-messages="confirmPasswordError ? [confirmPasswordError] : []"
              @click:append="showConfirmPassword = !showConfirmPassword"
              @input="validatePasswordMatch"
              outlined
              dense
            ></v-text-field>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="outlined"
            class="mr-2"
            @click="resetForm"
          >
            {{ $t('passwordChange.reset', 'Сбросить') }}
          </v-btn>
          <v-btn
            color="teal"
            variant="outlined"
            :loading="loading"
            @click="submitForm"
          >
            {{ mode === PasswordChangeMode.SELF 
              ? $t('passwordChange.change', 'Изменить') 
              : $t('passwordChange.resetPassword', 'Сменить пароль') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useValidationRules } from '../../../validation/rules.common.fields';
import { useUiStore } from '@/core/state/uistate';
import { ChangePasswordProps, PasswordChangeMode } from './types.change.password';
import changePassword from './service.self.change.password';
import resetPassword from './service.admin.change.password';

// Init i18n and stores
const { t } = useI18n();
const uiStore = useUiStore();

// Component props
const props = defineProps<ChangePasswordProps>();

// Form refs and validation
const form = ref<HTMLFormElement | null>(null);
const { passwordRules } = useValidationRules();

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
  
  // Run validation rules for password
  for (const rule of passwordRules) {
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
  console.log(`[ChangePassword] Submitting form in ${props.mode} mode`);
  
  if (!validateForm()) {
    console.log('[ChangePassword] Form validation failed');
    return;
  }
  
  loading.value = true;
  
  try {
    let response;
    
    if (props.mode === PasswordChangeMode.SELF) {
      // Self change password
      response = await changePassword({
        uuid: props.uuid,
        username: props.username,
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
      });
    } else {
      // Admin reset password
      response = await resetPassword({
        uuid: props.uuid,
        username: props.username,
        newPassword: newPassword.value
      });
    }
    
    if (response.success) {
      uiStore.showSuccessSnackbar(response.message || t('passwordChange.success', 'Пароль успешно изменен'));
      setTimeout(() => {
        closeModal();
      }, 2000);
    } else {
      uiStore.showErrorSnackbar(response.message || t('passwordChange.error', 'Ошибка при смене пароля'));
    }
  } catch (error) {
    console.error('[ChangePassword] Error during password change:', error);
    uiStore.showErrorSnackbar(t('passwordChange.unexpectedError', 'Непредвиденная ошибка при смене пароля'));
  } finally {
    loading.value = false;
  }
};

// Initialize form on mount
onMounted(() => {
  console.log(`[ChangePassword] Mounted in ${props.mode} mode for user ${props.username}`);
});
</script>

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