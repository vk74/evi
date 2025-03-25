<!--
  File: AppSettings.vue
  Description: General application settings component
  Purpose: Configure basic application settings like language and user registration
  
  Updated: 
  - Removed "use system language" toggle from Language section
  - Moved appearance section to the bottom
  - Removed dark theme toggle
  - Added user registration section from SecuritySettings
  - Added "функция в разработке" note for accent color
  - Standardized section dividers to match parent component style
  - Removed unused variables to avoid confusion
-->

<script setup lang="ts">
import { ref } from 'vue';

// Language settings
const selectedLanguage = ref('English');
const languages = [
  'English',
  'Русский'
];

// Theme settings
const selectedThemeColor = ref('teal-darken-2'); // Default to darker teal
const themeColors = [
  'teal-darken-2',
  'teal-darken-1',
  'teal',
  'teal-lighten-1',
  'teal-lighten-2'
];

// User registration settings (moved from SecuritySettings)
const allowSelfRegistration = ref(true);
const emailVerification = ref(true);
const adminApproval = ref(false);
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
    
    <!-- Language Settings -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
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
      </div>
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- User Registration (moved from SecuritySettings) -->
    <div class="settings-section mb-4">
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
      <v-divider class="mt-4"></v-divider>
    </div>
    
    <!-- Theme Settings (moved to the end, dark theme removed) -->
    <div class="settings-section">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon start icon="mdi-palette-outline" class="mr-2"></v-icon>
        appearance
      </div>
      
      <div class="section-content">
        <div class="d-flex align-start">
          <v-select
            v-model="selectedThemeColor"
            :items="themeColors"
            label="accent color"
            variant="outlined"
            density="comfortable"
            color="teal-darken-2"
            style="max-width: 200px;"
          ></v-select>
          <span class="text-caption text-grey ml-2 mt-6">функция в разработке</span>
        </div>
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

/* Make dividers same color as border in parent component */
:deep(.v-divider) {
  border-color: rgba(0, 0, 0, 0.12);
  opacity: 1;
}
</style>