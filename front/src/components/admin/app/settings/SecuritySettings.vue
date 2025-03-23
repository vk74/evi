<!--
  File: SecuritySettings.vue
  Description: Security settings component
  Purpose: Configure security-related settings including session management, password policies, and user registration
  
  Updated: Replaced card borders with dividers, converted text to lowercase, reorganized sections,
  adjusted session management controls and modified user registration section
-->

<script setup lang="ts">
import { ref, computed } from 'vue';

// Session management
const sessionDuration = ref(30);
const concurrentSessions = ref(true);
const maxSessionsPerUser = ref(5);

// Computed property for session duration label
const sessionDurationLabel = computed(() => {
  if (sessionDuration.value > 540) {
    return '∞';
  }
  return `${sessionDuration.value} минут`;
});

// Password policy
const passwordMinLength = ref(8);
const requireLowercase = ref(true);
const requireUppercase = ref(true);
const requireNumbers = ref(true);
const requireSpecialChars = ref(false);
const passwordExpiration = ref('90 days');
const passwordExpirationOptions = [
  'never',
  '30 days',
  '60 days',
  '90 days',
  '180 days',
  '1 year'
];
const forcePasswordChangeAfterExpiration = ref(true);

// User registration settings
const allowSelfRegistration = ref(true);
const emailVerification = ref(true);
const adminApproval = ref(false);
</script>

<template>
  <div class="security-settings-container">
    <h2 class="text-h6 mb-4">настройки безопасности</h2>
    
    <!-- Session Management -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-account-clock-outline" class="mr-2"></v-icon>
        session management
      </div>
      
      <div class="section-content">
        <v-slider
          v-model="sessionDuration"
          :label="`session duration: ${sessionDurationLabel}`"
          min="1"
          max="541"
          step="1"
          thumb-label
          class="mb-4"
          color="teal-darken-2"
        >
          <template v-slot:thumb-label>
            {{ sessionDuration > 540 ? '∞' : sessionDuration }}
          </template>
        </v-slider>
        
        <v-switch
          v-model="concurrentSessions"
          color="teal-darken-2"
          label="allow concurrent sessions"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <div class="d-flex align-center">
          <v-text-field
            v-model="maxSessionsPerUser"
            label="maximum sessions per user"
            type="number"
            variant="outlined"
            density="comfortable"
            class="mt-4"
            color="teal-darken-2"
            :disabled="!concurrentSessions"
            style="max-width: 200px;"
          ></v-text-field>
        </div>
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- Password Policy -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-form-textbox-password" class="mr-2"></v-icon>
        password policy
      </div>
      
      <div class="section-content">
        <v-slider
          v-model="passwordMinLength"
          :label="`minimum password length: ${passwordMinLength}`"
          min="8"
          max="24"
          step="1"
          thumb-label
          class="mb-4"
          color="teal-darken-2"
        ></v-slider>
        
        <v-switch
          v-model="requireLowercase"
          color="teal-darken-2"
          label="require lowercase letters"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-switch
          v-model="requireUppercase"
          color="teal-darken-2"
          label="require uppercase letters"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-switch
          v-model="requireNumbers"
          color="teal-darken-2"
          label="require numbers"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-switch
          v-model="requireSpecialChars"
          color="teal-darken-2"
          label="require special characters"
          hide-details
          class="mb-2"
        ></v-switch>
        
        <v-select
          v-model="passwordExpiration"
          :items="passwordExpirationOptions"
          label="password expiration"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          color="teal-darken-2"
          style="max-width: 200px;"
        ></v-select>
        
        <div class="d-flex align-start mt-4">
          <v-switch
            v-model="forcePasswordChangeAfterExpiration"
            color="teal-darken-2"
            label="force user to change password after expiration"
            hide-details
            :disabled="passwordExpiration === 'never'"
          ></v-switch>
          <span class="text-caption text-grey ml-2 mt-2">функция в разработке</span>
        </div>
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- User Registration -->
    <div class="settings-section">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-account-plus-outline" class="mr-2"></v-icon>
        user registration
      </div>
      
      <div class="section-content">
        <v-switch
          v-model="allowSelfRegistration"
          color="teal-darken-2"
          label="allow users self-registration"
          hide-details
          class="mb-4"
        ></v-switch>
        
        <div class="d-flex align-start">
          <v-switch
            v-model="emailVerification"
            color="teal-darken-2"
            label="require e-mail verification"
            hide-details
            class="mb-2"
          ></v-switch>
          <span class="text-caption text-grey ml-2 mt-2">функция в разработке</span>
        </div>
        
        <div class="d-flex align-start">
          <v-switch
            v-model="adminApproval"
            color="teal-darken-2"
            label="require admin approval"
            hide-details
            class="mb-2"
          ></v-switch>
          <span class="text-caption text-grey ml-2 mt-2">функция в разработке</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.security-settings-container {
  /* Maintain the container styling */
}

.settings-section {
  padding: 16px 0;
  transition: background-color 0.2s ease;
}

.settings-section:hover {
  background-color: rgba(0, 0, 0, 0.01);
}

.section-title {
  font-weight: 500;
}

/* Make dividers more subtle */
:deep(.v-divider) {
  opacity: 0.7;
}
</style>