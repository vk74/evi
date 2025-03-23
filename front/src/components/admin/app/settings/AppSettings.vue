<!--
  File: AppSettings.vue
  Description: General application settings component
  Purpose: Configure basic application settings like theme, language, notifications
  
  Updated: Removed card containers and replaced with div sections with dividers,
  standardized field widths, and improved section spacing for consistency with SecuritySettings
-->

<script setup lang="ts">
import { ref } from 'vue';

// Theme settings
const isDarkTheme = ref(false);
const selectedThemeColor = ref('teal-darken-2'); // Default to darker teal
const themeColors = [
  'teal-darken-2',
  'teal-darken-1',
  'teal',
  'teal-lighten-1',
  'teal-lighten-2'
];

// Language settings
const selectedLanguage = ref('English');
const useSystemLanguage = ref(true);
const languages = [
  'English',
  'Русский'
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

<template>
  <div class="app-settings-container">
    <h2 class="text-h6 mb-4">настройки приложения</h2>

    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4 mt-2"
    >
      настройки системы находится в разработке
    </v-alert>
    
    <!-- Theme Settings -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-palette-outline" class="mr-2"></v-icon>
        appearance
      </div>
      
      <div class="section-content">
        <v-switch
          v-model="isDarkTheme"
          color="teal-darken-2"
          label="dark theme"
          hide-details
        ></v-switch>
        
        <v-select
          v-model="selectedThemeColor"
          :items="themeColors"
          label="accent color"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          color="teal-darken-2"
          style="max-width: 200px;"
        ></v-select>
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- Language Settings -->
    <div class="settings-section">
      <div class="section-title text-subtitle-1 d-flex align-center mb-6">
        <v-icon start icon="mdi-translate" class="mr-2"></v-icon>
        language
      </div>
      
      <div class="section-content">
        <v-select
          v-model="selectedLanguage"
          :items="languages"
          label="fallback language"
          variant="outlined"
          density="comfortable"
          color="teal-darken-2"
          style="max-width: 200px;"
        ></v-select>
        
        <v-switch
          v-model="useSystemLanguage"
          color="teal-darken-2"
          label="use system language"
          hide-details
          class="mt-4"
        ></v-switch>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-settings-container {
  /* Base container styling */
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