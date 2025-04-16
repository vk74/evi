<!--
  File: UsersManagement.GroupsManagement.vue
  Description: Groups management settings component
  Purpose: Configure group related settings and group membership rules
-->

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAppSettingsStore } from '@/components/admin/settings/state.app.settings';
import { fetchSettings, getSettingValue } from '@/components/admin/settings/service.fetch.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'UsersManagement.GroupsManagement';

// Group management settings with default values - using correct setting name matching the database
// The setting "only.add.active.members" from database will control if only active members can be added to groups
const onlyAddActiveMembers = ref(false);

// Store reference
const appSettingsStore = useAppSettingsStore();

// Loading state
const isLoadingSettings = ref(true);

/**
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Groups Management');
    const settings = await fetchSettings(section_path);
    
    // Apply settings to component
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
      
      // Get specific settings by name with fallback values
      // Use the exact setting name as it appears in the database: "only.add.active.members"
      onlyAddActiveMembers.value = getSettingValue(
        section_path, 
        'only.add.active.members', 
        false
      );
      
      console.log('Applied setting "only.add.active.members":', onlyAddActiveMembers.value);
    } else {
      console.log('No settings received for Groups Management');
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
  console.log('UsersManagement.GroupsManagement component initialized');
  loadSettings();
});
</script>

<template>
  <div class="groups-management-container">
    <h2 class="text-h6 mb-4">управление группами</h2>
    
    <!-- Loading indicator -->
    <DataLoading :loading="isLoadingSettings" size="medium" />
    
    <!-- Settings content (only shown when not loading) -->
    <div v-if="!isLoadingSettings" class="settings-section">
      <div class="section-content">
        <v-switch
          v-model="onlyAddActiveMembers"
          color="teal-darken-2"
          label="добавлять в группы только пользователей со статусом 'активен'"
          hide-details
        ></v-switch>
      </div>
    </div>
  </div>
</template>

<style scoped>
.groups-management-container {
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