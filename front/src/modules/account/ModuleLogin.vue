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
  - Error and success message handling
-->

<script setup>
import { ref } from 'vue'
import { jwtDecode } from 'jwt-decode'
import { useUserStore } from '@/core/state/userstate'
import { useAppStore } from '@/core/state/appstate'
import { startSessionTimers } from '@/core/services/sessionServices'
import axios from 'axios'

// ==================== STORES ====================
const userStore = useUserStore()
const appStore = useAppStore()

// ==================== REFS & STATE ====================
/**
 * Form data and UI state
 */
const username = ref('')
const password = ref('')
const showError = ref(false)
const showSuccess = ref(false)

// ==================== METHODS ====================
/**
 * Handle user login process
 * Authenticates user with backend, processes JWT token, and updates user state
 */
const login = async () => {
  console.log("Login:", username.value, "Pass:", password.value)
  showError.value = false // Reset error on each new login attempt
  showSuccess.value = false // Reset success message on each new attempt
  
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

      showSuccess.value = true
      showError.value = false
      
      setTimeout(() => {
        closeDialog()
      }, 1000)
      
      appStore.setActiveModule('Catalog')
    } else {
      showError.value = true // Show error if validation fails
    }
  } catch (error) {
    showError.value = true // Show error if request fails
    console.error('Error sending request:', error)
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
        вход в приложение
      </v-card-title>
      <v-card-text>
        <v-form>
          <v-text-field
            ref="loginInput"
            v-model="username"
            label="логин"
            required
          />
          <v-text-field
            v-model="password"
            label="пароль"
            type="password"
            required
          />
        </v-form>
        <p v-if="showError">
          неправильное имя пользователя либо пароль
        </p>
        <p v-if="showSuccess">
          успешно
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          color="teal darken-1"
          text
          @click="login"
        >
          войти
        </v-btn>
      </v-card-actions>
      <div class="divider" />
      <p class="register-text">
        если у вас нет учетной записи ev2, <a
          href="#"
          class="register-link"
          @click.prevent="goToRegistration"
        >зарегистрируйтесь</a>
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