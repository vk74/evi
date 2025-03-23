<!--
  File: GeneralSettings.vue
  Description: General application settings component
  Purpose: Configure basic application settings like theme, language, notifications
  
  Enhanced with responsive design adjustments to work with parent component transitions
  Updated: Changed border colors to grey and moved script block above template
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
  <div class="settings-container">
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
    <v-card variant="outlined" class="mb-4 settings-card">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-palette-outline" class="mr-2"></v-icon>
        appearance
      </v-card-title>
      <v-card-text>
        <v-switch
          v-model="isDarkTheme"
          color="teal-darken-2"
          label="dark Theme"
          hide-details
        ></v-switch>
        
        <v-select
          v-model="selectedThemeColor"
          :items="themeColors"
          label="accent Color"
          variant="outlined"
          density="comfortable"
          class="mt-4"
          color="teal-darken-2"
        ></v-select>
      </v-card-text>
    </v-card>
    
    <!-- Language Settings -->
    <v-card variant="outlined" class="mb-4 settings-card">
      <v-card-title class="text-subtitle-1">
        <v-icon start icon="mdi-translate" class="mr-2"></v-icon>
        language
      </v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedLanguage"
          :items="languages"
          label="fallback language"
          variant="outlined"
          density="comfortable"
          color="teal-darken-2"
        ></v-select>
        
        <v-switch
          v-model="useSystemLanguage"
          color="teal-darken-2"
          label="Use system language"
          hide-details
          class="mt-4"
        ></v-switch>
      </v-card-text>
    </v-card>
  </div>
</template>

<style scoped>
/* Add subtle animations and transitions to settings cards */
.settings-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-color: rgba(0, 0, 0, 0.12) !important;
}

.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
}

/* Target all outlined cards in this component */
:deep(.v-card.v-card--variant-outlined) {
  border-color: rgba(0, 0, 0, 0.12) !important;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .update-header {
    flex-direction: column;
    align-items: flex-start !important;
  }
  
  .update-header button {
    margin-top: 12px;
    align-self: flex-start;
  }
}
</style>