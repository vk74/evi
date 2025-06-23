<!--
  File: UsersManagement.vue
  Description: User management settings component
  Purpose: Configure general user management settings and account behavior
-->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';
import { fetchSettings, getSettingValue } from '@/modules/admin/settings/service.fetch.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'UsersManagement';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Loading state
const isLoadingSettings = ref(true);

// Account management settings
const maxInactivityDays = ref(90);
const notifyBeforeAccountExpiry = ref(true);
const daysBeforeNotification = ref(14);
const enableBulkAccountOperations = ref(true);
const requireCommentOnAccountStatusChange = ref(true);

/**
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Users Management');
    const settings = await fetchSettings(section_path);
    
    // Apply settings to component
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
      
      // Get specific settings by name with fallback values
      maxInactivityDays.value = getSettingValue(section_path, 'maxInactivityDays', 90);
      notifyBeforeAccountExpiry.value = getSettingValue(section_path, 'notifyBeforeAccountExpiry', true);
      daysBeforeNotification.value = getSettingValue(section_path, 'daysBeforeNotification', 14);
      enableBulkAccountOperations.value = getSettingValue(section_path, 'enableBulkAccountOperations', true);
      requireCommentOnAccountStatusChange.value = getSettingValue(section_path, 'requireCommentOnAccountStatusChange', true);
    } else {
      console.log('No settings received for Users Management - using defaults');
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
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
  console.log('UsersManagement component initialized');
  loadSettings();
});
</script>

<template>
  <div class="user-management-container">
    <h2 class="text-h6 mb-4">
      настройки пользователей
    </h2>
    
    <!-- Account Activity Management -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon
          start
          icon="mdi-account-clock-outline"
          class="mr-2"
        />
        Account Activity
      </div>
      
      <div class="section-content">
        <v-row>
          <v-col
            cols="12"
            sm="8"
          >
            <v-slider
              v-model="maxInactivityDays"
              min="30"
              max="365"
              step="1"
              thumb-label
              label="Maximum days of inactivity before account disabled"
              color="teal-darken-2"
            >
              <template #append>
                <v-text-field
                  v-model="maxInactivityDays"
                  density="compact"
                  style="width: 80px"
                  hide-details
                  variant="outlined"
                  type="number"
                  min="30"
                  max="365"
                />
              </template>
            </v-slider>
          </v-col>
        </v-row>
        
        <v-switch
          v-model="notifyBeforeAccountExpiry"
          color="teal-darken-2"
          label="Notify users before account disabled due to inactivity"
          hide-details
          class="mb-3"
        />
        
        <v-row v-if="notifyBeforeAccountExpiry">
          <v-col
            cols="12"
            sm="8"
            class="pl-8"
          >
            <v-slider
              v-model="daysBeforeNotification"
              min="1"
              max="30"
              step="1"
              thumb-label
              label="Days before inactivity threshold to send notification"
              color="teal-darken-2"
            >
              <template #append>
                <v-text-field
                  v-model="daysBeforeNotification"
                  density="compact"
                  style="width: 80px"
                  hide-details
                  variant="outlined"
                  type="number"
                  min="1"
                  max="30"
                />
              </template>
            </v-slider>
          </v-col>
        </v-row>
      </div>
      <v-divider class="mt-4" />
    </div>
    
    <!-- Administrative Operations -->
    <div class="settings-section">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon
          start
          icon="mdi-account-cog-outline"
          class="mr-2"
        />
        Administrative Operations
      </div>
      
      <div class="section-content">
        <v-switch
          v-model="enableBulkAccountOperations"
          color="teal-darken-2"
          label="Enable bulk operations for user accounts"
          hide-details
          class="mb-3"
        />
        
        <v-switch
          v-model="requireCommentOnAccountStatusChange"
          color="teal-darken-2"
          label="Require comment when changing user account status"
          hide-details
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-management-container {
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