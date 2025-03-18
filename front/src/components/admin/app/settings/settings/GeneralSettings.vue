<!--
  File: GeneralSettings.vue
  Description: General application settings component
  Purpose: Configure basic application settings like theme, language, notifications
-->

<template>
  <div class="settings-section">
    <h2 class="text-h6 mb-4">Application Settings</h2>
    
    <!-- Theme Settings -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-palette-outline" class="mr-2"></v-icon>
        Appearance
      </v-card-title>
      <v-card-text>
        <v-switch
          v-model="isDarkTheme"
          color="primary"
          label="Dark Theme"
          hide-details
        ></v-switch>
        
        <v-select
          v-model="selectedThemeColor"
          :items="themeColors"
          label="Accent Color"
          variant="outlined"
          density="comfortable"
          class="mt-4"
        ></v-select>
      </v-card-text>
    </v-card>
    
    <!-- Language Settings -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-translate" class="mr-2"></v-icon>
        Language
      </v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedLanguage"
          :items="languages"
          label="Display Language"
          variant="outlined"
          density="comfortable"
        ></v-select>
        
        <v-switch
          v-model="useSystemLanguage"
          color="primary"
          label="Use system language"
          hide-details
          class="mt-4"
        ></v-switch>
      </v-card-text>
    </v-card>
    
    <!-- Notification Settings -->
    <v-card variant="outlined" class="mb-4">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-bell-outline" class="mr-2"></v-icon>
        Notifications
      </v-card-title>
      <v-card-text>
        <v-switch
          v-model="enableNotifications"
          color="primary"
          label="Enable notifications"
          hide-details
        ></v-switch>
        
        <v-switch
          v-model="enableSounds"
          color="primary"
          label="Notification sounds"
          hide-details
          class="mt-2"
          :disabled="!enableNotifications"
        ></v-switch>
        
        <v-slider
          v-model="notificationVolume"
          label="Volume"
          min="0"
          max="100"
          step="10"
          show-ticks="always"
          :disabled="!enableNotifications || !enableSounds"
          class="mt-4"
        >
          <template v-slot:prepend>
            <v-icon icon="mdi-volume-low"></v-icon>
          </template>
          <template v-slot:append>
            <v-icon icon="mdi-volume-high"></v-icon>
          </template>
        </v-slider>
      </v-card-text>
    </v-card>
    
    <!-- Updates Settings -->
    <v-card variant="outlined">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-update" class="mr-2"></v-icon>
        Updates
      </v-card-title>
      <v-card-text>
        <div class="d-flex justify-space-between align-center mb-3">
          <div>
            <div class="text-body-1">Check for updates</div>
            <div class="text-caption text-medium-emphasis">Last checked: {{ lastUpdateCheck }}</div>
          </div>
          <v-btn
            variant="tonal"
            color="primary"
            size="small"
            prepend-icon="mdi-refresh"
            @click="checkUpdates"
          >
            Check now
          </v-btn>
        </div>
        
        <v-select
          v-model="updateFrequency"
          :items="updateFrequencies"
          label="Update Frequency"
          variant="outlined"
          density="comfortable"
        ></v-select>
        
        <v-switch
          v-model="autoInstallUpdates"
          color="primary"
          label="Auto-install updates"
          hide-details
          class="mt-4"
        ></v-switch>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// Theme settings
const isDarkTheme = ref(false);
const selectedThemeColor = ref('blue');
const themeColors = [
  'blue',
  'green',
  'purple',
  'red',
  'orange',
  'teal'
];

// Language settings
const selectedLanguage = ref('English');
const useSystemLanguage = ref(true);
const languages = [
  'English',
  'Русский',
  'Español',
  'Français',
  'Deutsch',
  '中文',
  '日本語'
];

// Notification settings
const enableNotifications = ref(true);
const enableSounds = ref(true);
const notificationVolume = ref(70);

// Update settings
const lastUpdateCheck = ref('Today, 10:23 AM');
const updateFrequency = ref('Daily');
const autoInstallUpdates = ref(false);
const updateFrequencies = [
  'Manual',
  'Daily',
  'Weekly',
  'Monthly'
];

/**
 * Simulates checking for updates
 * In a real implementation, this would make an API call to check for updates
 */
const checkUpdates = () => {
  lastUpdateCheck.value = new Date().toLocaleString();
  // Implement actual update checking logic here
};
</script>

<style scoped>
.settings-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}
</style>