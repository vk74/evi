<!--
  File: ModuleLogin.vue
  Version: 1.2.0
  Description: User login component for frontend
  Purpose: Handles authentication process, JWT token processing and user state management
  Frontend file that manages user login form, integrates with JWT token processing, and handles user session management
  
  Features:
  - User authentication with username and password
  - Device fingerprint generation and validation
  - JWT token processing and storage
  - User state management with Pinia stores
  - Session timer initialization
  - Navigation to registration module
  - Error and success message handling with toast notifications
-->

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/core/state/appstate'
import { useUiStore } from '@/core/state/uistate'
import { loginService } from './service.login'

interface LoginResult {
  success: boolean;
  errorKey?: string;
}

// ==================== I18N ====================
const { t } = useI18n()

// ==================== STORES ====================
const appStore = useAppStore()
const uiStore = useUiStore()

// ==================== REFS & STATE ====================
/**
 * Form data and UI state
 */
const username = ref<string>('')
const password = ref<string>('')

// ==================== METHODS ====================
/**
 * Handle user login process
 * Authenticates user with backend, processes JWT token, and updates user state
 * Now includes device fingerprint generation for enhanced security
 */
const login = async (): Promise<void> => {
  console.log("Login:", username.value, "Pass:", password.value)
  
  const result: LoginResult = await loginService(username.value, password.value)
  
  if (result.success) {
    console.log('User logged in successfully')
    
    // Close dialog and navigate to catalog
    setTimeout(() => {
      closeDialog()
    }, 1000)
    
    appStore.setActiveModule('Catalog')
  } else {
    // Show error message using i18n translation
    const errorMessage = result.errorKey ? t(result.errorKey) : t('login.errors.unknownError')
    uiStore.showErrorSnackbar(errorMessage)
  }
}

/**
 * Close login dialog
 * Emits close event to parent component
 */
const closeDialog = (): void => {
  // Note: dialog variable is not defined in this component
  // This method is kept for compatibility but may need adjustment
  emit('close') // Notify parent component about closure
}

/**
 * Navigate to registration module
 * Changes active module to NewUserRegistration
 */
const goToRegistration = (): void => {
  appStore.setActiveModule('NewUserRegistration')
}

// ==================== EMITS ====================
const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="pt-3 pl-3"> 
    <div style="max-width: 500px; padding-left: 24px;">
      <div
        class="text-h5"
        style="margin-bottom: 16px;"
      >
        {{ t('login.title') }}
      </div>
      <div>
        <v-form>
          <v-text-field
            ref="loginInput"
            v-model="username"
            :label="t('login.fields.username.label')"
            variant="outlined"
            density="comfortable"
            color="teal"
            required
          />
          <v-text-field
            v-model="password"
            :label="t('login.fields.password.label')"
            type="password"
            variant="outlined"
            density="comfortable"
            color="teal"
            required
          />
        </v-form>
      </div>
      <div style="display: flex; justify-content: flex-end; margin-top: 16px;">
        <v-btn
          color="teal"
          variant="outlined"
          @click="login"
        >
          {{ t('login.buttons.signIn') }}
        </v-btn>
      </div>
      <div class="divider" />
      <p class="register-text">
        {{ t('login.registration.text') }} <a
          href="#"
          class="register-link"
          @click.prevent="goToRegistration"
        >{{ t('login.registration.link') }}</a>
      </p><br>
    </div>
  </div>  
</template>

<style scoped>
.divider {
  width: calc(100% - 32px); /* Width same as login and password fields */
  height: 1px;
  background-color: #ccc;
  margin: 16px auto; /* Top and bottom margins */
}

.register-text {
  text-align: center;
  margin-top: 16px;
}

.register-link {
  color: teal;
  text-decoration: none;
}

.register-link:hover {
  text-decoration: underline;
}
</style>