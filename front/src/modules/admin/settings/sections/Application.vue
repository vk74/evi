<!--
  File: Application.vue
  Description: General application settings component
  Purpose: Configure basic application settings like language and user registration
-->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings, getSettingValue } from '@/modules/admin/settings/service.fetch.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'Application';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Loading state
const isLoadingSettings = ref(true);

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

/**
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Application root section');
    
    try {
      const settings = await fetchSettings(section_path);
      
      // Apply settings to component if any received
      if (settings && settings.length > 0) {
        console.log('Received settings:', settings);
        
        // Apply settings for language, theme, registration
        selectedLanguage.value = getSettingValue(section_path, 'defaultLanguage', 'English');
        selectedThemeColor.value = getSettingValue(section_path, 'accentColor', 'teal-darken-2');
        allowSelfRegistration.value = getSettingValue(section_path, 'allowSelfRegistration', true);
        emailVerification.value = getSettingValue(section_path, 'requireEmailVerification', true);
        adminApproval.value = getSettingValue(section_path, 'requireAdminApproval', false);
      } else {
        console.log('No settings received for Application root section - using defaults');
      }
    } catch (error) {
      // Ignore errors for root Application section as it might not have settings yet
      console.log('No settings available for Application section - this is expected', error);
    }
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
  console.log('Application settings component initialized');
  loadSettings();
});
</script>

<template>
  <div class="app-settings-container">
    <h2 class="text-h6 mb-4">
      настройки приложения
    </h2>

    <!-- Loading indicator -->
    <DataLoading
      :loading="isLoadingSettings"
      size="medium"
    />

    <template v-if="!isLoadingSettings">
      <v-alert
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4 mt-2"
      >
        компонент находится в разработке
      </v-alert>
      
      <!-- Language Settings -->
      <div class="settings-section mb-4">
        <div class="section-title text-subtitle-1 d-flex align-center mb-4">
          <v-icon
            start
            icon="mdi-translate"
            class="mr-2"
          />
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
          />
        </div>
        <v-divider class="mt-4" />
      </div>
      
      <!-- User Registration (moved from SecuritySettings) -->
      <div class="settings-section mb-4">
        <div class="section-title text-subtitle-1 d-flex align-center mb-4">
          <v-icon
            start
            icon="mdi-account-plus-outline"
            class="mr-2"
          />
          user registration
        </div>
        
        <div class="section-content">
          <v-switch
            v-model="allowSelfRegistration"
            color="teal-darken-2"
            label="allow users self-registration"
            hide-details
            class="mb-4"
          />
          
          <div class="d-flex align-start">
            <v-switch
              v-model="emailVerification"
              color="teal-darken-2"
              label="require e-mail verification"
              hide-details
              class="mb-2"
            />
            <span class="text-caption text-grey ml-2 mt-2">функция в разработке</span>
          </div>
          
          <div class="d-flex align-start">
            <v-switch
              v-model="adminApproval"
              color="teal-darken-2"
              label="require admin approval"
              hide-details
              class="mb-2"
            />
            <span class="text-caption text-grey ml-2 mt-2">функция в разработке</span>
          </div>
        </div>
        <v-divider class="mt-4" />
      </div>
      
      <!-- Theme Settings (moved to the end, dark theme removed) -->
      <div class="settings-section">
        <div class="section-title text-subtitle-1 d-flex align-center mb-4">
          <v-icon
            start
            icon="mdi-palette-outline"
            class="mr-2"
          />
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
            />
            <span class="text-caption text-grey ml-2 mt-6">функция в разработке</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.app-settings-container {
  /* Base container styling */
  position: relative;
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