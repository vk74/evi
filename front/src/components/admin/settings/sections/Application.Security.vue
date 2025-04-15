<!--
  File: Application.Security.vue
  Description: Security settings component
  Purpose: Configure security-related settings including session management and password policies
-->

<script setup lang="ts">
import { ref, computed } from 'vue';

// Session management
const sessionDuration = ref('30');
const unlimitedSession = ref(false);
const concurrentSessions = ref(true);
const maxSessionsPerUser = ref(2);

// Session duration options (10 minutes to 24 hours)
const sessionDurationOptions = [
  { title: '10 минут', value: '10' },
  { title: '15 минут', value: '15' },
  { title: '30 минут', value: '30' },
  { title: '1 час', value: '60' },
  { title: '2 часа', value: '120' },
  { title: '4 часа', value: '240' },
  { title: '8 часов', value: '480' },
  { title: '12 часов', value: '720' },
  { title: '1 сутки', value: '1440' }
];

// Password policy
const passwordMinLength = ref('8');
const passwordLengthOptions = Array.from({ length: 17 }, (_, i) => (i + 8).toString());
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

// Log component initialization
console.log('Application.Security component initialized');
</script>

<template>
  <div class="security-settings-container">
    <h2 class="text-h6 mb-4">настройки безопасности</h2>
    
    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4 mt-2"
    >
      компонент находится в разработке
    </v-alert>
    
    <!-- Session Management -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-account-clock-outline" class="mr-2"></v-icon>
        session management
      </div>
      
      <div class="section-content">
        <div class="d-flex align-center mb-2">
          <v-select
            v-model="sessionDuration"
            :items="sessionDurationOptions"
            label="session duration"
            variant="outlined"
            density="comfortable"
            color="teal-darken-2"
            style="max-width: 200px;"
            :disabled="unlimitedSession"
          ></v-select>
          
          <v-tooltip location="top" max-width="300">
            <template v-slot:activator="{ props }">
              <v-icon 
                icon="mdi-help-circle-outline" 
                size="small" 
                class="ms-2" 
                color="teal-darken-2"
                v-bind="props"
              ></v-icon>
            </template>
            <div class="pa-2">
              Более длинная сессия улучшает удобство пользователей, но может снизить безопасность
            </div>
          </v-tooltip>
        </div>
        
        <div class="mb-4">
          <v-checkbox
            v-model="unlimitedSession"
            color="teal-darken-2"
            label="сессия без ограничения по времени"
            hide-details
          ></v-checkbox>
        </div>
        
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
    <div class="settings-section">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-form-textbox-password" class="mr-2"></v-icon>
        password policy
      </div>
      
      <div class="section-content">
        <v-select
          v-model="passwordMinLength"
          :items="passwordLengthOptions"
          label="minimum password length"
          variant="outlined"
          density="comfortable"
          class="mb-4"
          color="teal-darken-2"
          style="max-width: 200px;"
        ></v-select>
        
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

/* Make dividers same color as border in parent component */
:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.12);
  opacity: 1;
}
</style>