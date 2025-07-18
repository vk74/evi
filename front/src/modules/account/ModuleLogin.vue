<!--
  File: ModuleLogin.vue
  Version: 1.0.0
  Description: User login component for frontend
  Purpose: Handles authentication process, JWT token processing and user state management
  Frontend file that manages user login form, integrates with JWT token processing, and handles user session management
  
  Features:
  - User authentication with username and password
  - JWT token processing and storage
  - User state management with Pinia stores
  - Session timer initialization
  - Navigation to registration module
  - Error and success message handling with toast notifications
-->

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { jwtDecode } from 'jwt-decode'
import { useUserStore } from '@/core/state/userstate'
import { useAppStore } from '@/core/state/appstate'
import { useUiStore } from '@/core/state/uistate'
import { startSessionTimers } from '@/core/services/sessionServices'
import axios from 'axios'

// ==================== I18N ====================
const { t } = useI18n()

// ==================== STORES ====================
const userStore = useUserStore()
const appStore = useAppStore()
const uiStore = useUiStore()

// ==================== REFS & STATE ====================
/**
 * Form data and UI state
 */
const username = ref('')
const password = ref('')

// ==================== METHODS ====================
/**
 * Handle user login process
 * Authenticates user with backend, processes JWT token, and updates user state
 */
const login = async () => {
  console.log("Login:", username.value, "Pass:", password.value)
  
  try {
    const response = await axios.post('http://localhost:3000/login', {
      username: username.value,
      password: password.value
    })
    
    console.log('reply from backend server:', response)
    
    if (response.data.success) {
      localStorage.setItem('userToken', response.data.token) // Save token to localStorage for persistent authentication
      const decoded = jwtDecode(response.data.token) // Decode JWT to extract payload data
      console.log('decoded JWT:', decoded)
      
      // Update Pinia store with token payload data
      userStore.setUsername(decoded.sub) // Set username
      userStore.setUserID(decoded.uid) // Set user UUID
      userStore.setLoggedIn(true) // Set authentication flag to true
      userStore.setJwt(response.data.token) // Save the token itself
      
      // Update remaining fields based on decoded token
      userStore.setIssuer(decoded.iss)
      userStore.setAudience(decoded.aud)
      userStore.setIssuedAt(decoded.iat)
      userStore.setJwtId(decoded.jti)
      userStore.setTokenExpires(decoded.exp) // Token expiration time
      
      console.log('User logged in successfully')
      startSessionTimers()

      setTimeout(() => {
        closeDialog()
      }, 1000)
      
      appStore.setActiveModule('Catalog')
    } else {
      // Handle validation failure from backend
      uiStore.showErrorSnackbar(t('login.errors.invalidCredentials'))
    }
  } catch (error) {
    console.error('Error sending request:', error)
    
    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      if (error.response.status >= 500) {
        uiStore.showErrorSnackbar(t('login.errors.serverError'))
      } else if (error.response.status === 401) {
        uiStore.showErrorSnackbar(t('login.errors.invalidCredentials'))
      } else {
        uiStore.showErrorSnackbar(t('login.errors.unknownError'))
      }
    } else if (error.request) {
      // Network error - no response received
      uiStore.showErrorSnackbar(t('login.errors.networkError'))
    } else {
      // Other errors
      uiStore.showErrorSnackbar(t('login.errors.unknownError'))
    }
  }
}

/**
 * Close login dialog
 * Emits close event to parent component
 */
const closeDialog = () => {
  // Note: dialog variable is not defined in this component
  // This method is kept for compatibility but may need adjustment
  emit('close') // Notify parent component about closure
}

/**
 * Navigate to registration module
 * Changes active module to NewUserRegistration
 */
const goToRegistration = () => {
  appStore.setActiveModule('NewUserRegistration')
}

// ==================== EMITS ====================
const emit = defineEmits(['close'])
</script>

<template>
  <div class="pt-3 pl-3"> 
    <v-card max-width="500px">
      <v-card-title class="text-h5">
        {{ t('login.title') }}
      </v-card-title>
      <v-card-text>
        <v-form>
          <v-text-field
            ref="loginInput"
            v-model="username"
            :label="t('login.fields.username.label')"
            required
          />
          <v-text-field
            v-model="password"
            :label="t('login.fields.password.label')"
            type="password"
            required
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="teal"
          variant="outlined"
          @click="login"
        >
          {{ t('login.buttons.signIn') }}
        </v-btn>
      </v-card-actions>
      <div class="divider" />
      <p class="register-text">
        {{ t('login.registration.text') }} <a
          href="#"
          class="register-link"
          @click.prevent="goToRegistration"
        >{{ t('login.registration.link') }}</a>
      </p><br>
    </v-card>
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