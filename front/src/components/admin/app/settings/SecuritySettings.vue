<!--
  File: UserManagement.vue
  Description: User management settings component
  Purpose: Configure user-related settings, permissions, authentication methods
  
  Updated: Moved script block above template and added scoped styles for card borders
-->

<script setup lang="ts">
import { ref } from 'vue';

// Authentication settings
const authMethod = ref('Email & Password');
const authMethods = [
  'Email & Password',
  'OAuth 2.0',
  'LDAP',
  'SAML',
  'Active Directory'
];
const enableMFA = ref(true);
const singleSignOn = ref(false);

// Password policy
const passwordMinLength = ref(8);
const requireLowercase = ref(true);
const requireUppercase = ref(true);
const requireNumbers = ref(true);
const requireSpecialChars = ref(false);
const passwordExpiration = ref('90 days');
const passwordExpirationOptions = [
  'Never',
  '30 days',
  '60 days',
  '90 days',
  '180 days',
  '1 year'
];

// Registration settings
const registrationType = ref('Self-registration');
const registrationTypes = [
  'Self-registration',
  'Invitation only',
  'Admin-created accounts only'
];
const emailVerification = ref(true);
const adminApproval = ref(false);
const defaultUserRole = ref('User');

// Session management
const sessionTimeout = ref(30);
const rememberMe = ref(true);
const concurrentSessions = ref(true);
const maxSessionsPerUser = ref(5);
</script>

<template>
  <div class="user-management-container">
    <h2 class="text-h6 mb-4">настройки безопасности</h2>
    <!-- User Authentication -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-lock-outline" class="mr-2"></v-icon>
        Authentication
      </v-card-title>
      <v-card-text>
        <v-select
          v-model="authMethod"
          :items="authMethods"
          label="Default Authentication Method"
          variant="outlined"
          density="comfortable"
          color="teal-darken-2"
        ></v-select>
        
        <v-switch
          v-model="enableMFA"
          color="teal-darken-2"
          label="Require Multi-Factor Authentication"
          hide-details
          class="mt-4"
        ></v-switch>
        
        <v-switch
          v-model="singleSignOn"
          color="teal-darken-2"
          label="Enable Single Sign-On (SSO)"
          hide-details
          class="mt-2"
        ></v-switch>
      </v-card-text>
    </v-card>
    
    <!-- Password Policy -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-form-textbox-password" class="mr-2"></v-icon>
        Password Policy
      </v-card-title>
      <v-card-text>
        <v-slider
          v-model="passwordMinLength"
          label="Minimum Password Length"
          min="6"
          max="16"
          step="1"
          thumb-label
          class="mb-4"
          color="teal-darken-2"
        ></v-slider>
        
        <v-switch
          v-model="requireLowercase"
          color="teal-darken-2"
          label="Require lowercase letters"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-switch
          v-model="requireUppercase"
          color="teal-darken-2"
          label="Require uppercase letters"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-switch
          v-model="requireNumbers"
          color="teal-darken-2"
          label="Require numbers"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-switch
          v-model="requireSpecialChars"
          color="teal-darken-2"
          label="Require special characters"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-select
          v-model="passwordExpiration"
          :items="passwordExpirationOptions"
          label="Password Expiration"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          color="teal-darken-2"
        ></v-select>
      </v-card-text>
    </v-card>
    
    <!-- User Registration -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-account-plus-outline" class="mr-2"></v-icon>
        User Registration
      </v-card-title>
      <v-card-text>
        <v-select
          v-model="registrationType"
          :items="registrationTypes"
          label="Registration Type"
          variant="outlined"
          density="comfortable"
          color="teal-darken-2"
        ></v-select>
        
        <v-switch
          v-model="emailVerification"
          color="teal-darken-2"
          label="Require email verification"
          hide-details
          class="mt-4"
        ></v-switch>
        
        <v-switch
          v-model="adminApproval"
          color="teal-darken-2"
          label="Require admin approval"
          hide-details
          class="mt-2"
        ></v-switch>
        
        <v-text-field
          v-model="defaultUserRole"
          label="Default User Role"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          color="teal-darken-2"
        ></v-text-field>
      </v-card-text>
    </v-card>
    
    <!-- Session Management -->
    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-account-clock-outline" class="mr-2"></v-icon>
        Session Management
      </v-card-title>
      <v-card-text>
        <v-slider
          v-model="sessionTimeout"
          label="Session Timeout (minutes)"
          min="5"
          max="240"
          step="5"
          thumb-label
          class="mb-4"
          color="teal-darken-2"
        ></v-slider>
        
        <v-switch
          v-model="rememberMe"
          color="teal-darken-2"
          label="Allow 'Remember Me' option"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-switch
          v-model="concurrentSessions"
          color="teal-darken-2"
          label="Allow concurrent sessions"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-text-field
          v-model="maxSessionsPerUser"
          label="Maximum Sessions per User"
          type="number"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          color="teal-darken-2"
          :disabled="!concurrentSessions"
        ></v-text-field>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
/* Target only the cards within this component */
:deep(.v-card.v-card--variant-outlined) {
  border-color: rgba(0, 0, 0, 0.12) !important;
}

/* Add subtle hover effect to cards in this component */
.user-management-container .v-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.user-management-container .v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}
</style>