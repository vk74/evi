<!--
  File: Application.Security.vue
  Description: Security settings component
  Purpose: Configure security-related settings including session management and password policies
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings, getSettingValue } from '@/modules/admin/settings/service.fetch.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'Application.Security';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Loading state
const isLoadingSettings = ref(true);

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

/**
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Application.Security section');
    const settings = await fetchSettings(section_path);
    
    // Apply settings to component
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
      
      // Apply session management settings
      sessionDuration.value = getSettingValue(section_path, 'sessionDuration', '30');
      unlimitedSession.value = getSettingValue(section_path, 'unlimitedSession', false);
      concurrentSessions.value = getSettingValue(section_path, 'concurrentSessions', true);
      maxSessionsPerUser.value = getSettingValue(section_path, 'maxSessionsPerUser', 2);
      
      // Apply password policy settings
      passwordMinLength.value = getSettingValue(section_path, 'passwordMinLength', '8');
      requireLowercase.value = getSettingValue(section_path, 'requireLowercase', true);
      requireUppercase.value = getSettingValue(section_path, 'requireUppercase', true);
      requireNumbers.value = getSettingValue(section_path, 'requireNumbers', true);
      requireSpecialChars.value = getSettingValue(section_path, 'requireSpecialChars', false);
      passwordExpiration.value = getSettingValue(section_path, 'passwordExpiration', '90 days');
      forcePasswordChangeAfterExpiration.value = getSettingValue(section_path, 'forcePasswordChangeAfterExpiration', true);
    } else {
      console.log('No settings received for Application.Security section - using defaults');
    }
  } catch (error) {
    console.error('Failed to load security settings:', error);
  } finally {
    isLoadingSettings.value = false;
  }
}

// Watch for changes in loading state from the store
watch(
  () => appSettingsStore.isLoading,
  (isLoading) => {
    isLoadingSettings.value = isLoading;
  }
);

// Initialize component
onMounted(() => {
  console.log('Application.Security component initialized');
  loadSettings();
});
</script>

<template>
  <div class="security-settings-container">
    <h2 class="text-h6 mb-4">
      настройки безопасности
    </h2>
    
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
        <v-icon
          start
          icon="mdi-account-clock-outline"
          class="mr-2"
        />
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
          />
          
          <v-tooltip
            location="top"
            max-width="300"
          >
            <template #activator="{ props }">
              <v-icon 
                icon="mdi-help-circle-outline" 
                size="small" 
                class="ms-2" 
                color="teal-darken-2"
                v-bind="props"
              />
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
          />
        </div>
        
        <v-switch
          v-model="concurrentSessions"
          color="teal-darken-2"
          label="allow concurrent sessions"
          hide-details
          class="mb-2"
        />
        
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
          />
        </div>
      </div>
      <v-divider class="mt-4" />
    </div>
    
    <!-- Password Policy -->
    <div class="settings-section">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon
          start
          icon="mdi-form-textbox-password"
          class="mr-2"
        />
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
        />
        
        <v-switch
          v-model="requireLowercase"
          color="teal-darken-2"
          label="require lowercase letters"
          hide-details
          class="mb-2"
        />
        
        <v-switch
          v-model="requireUppercase"
          color="teal-darken-2"
          label="require uppercase letters"
          hide-details
          class="mb-2"
        />
        
        <v-switch
          v-model="requireNumbers"
          color="teal-darken-2"
          label="require numbers"
          hide-details
          class="mb-2"
        />
        
        <v-switch
          v-model="requireSpecialChars"
          color="teal-darken-2"
          label="require special characters"
          hide-details
          class="mb-2"
        />
        
        <v-select
          v-model="passwordExpiration"
          :items="passwordExpirationOptions"
          label="password expiration"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          color="teal-darken-2"
          style="max-width: 200px;"
        />
        
        <div class="d-flex align-start mt-4">
          <v-switch
            v-model="forcePasswordChangeAfterExpiration"
            color="teal-darken-2"
            label="force user to change password after expiration"
            hide-details
            :disabled="passwordExpiration === 'never'"
          />
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