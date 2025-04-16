<!--
  File: UsersManagement.GroupsManagement.vue
  Description: Groups management settings component
  Purpose: Configure group related settings and group membership rules
-->

<script setup lang="ts">
import { computed, onMounted, watch, ref } from 'vue';
import { useAppSettingsStore } from '@/components/admin/settings/state.app.settings';
import { fetchSettings } from '@/components/admin/settings/service.fetch.settings';
import { updateSettingFromComponent } from '@/components/admin/settings/service.update.settings';
import DataLoading from '@/core/ui/loaders/DataLoading.vue';

// Section path identifier - using component name for better consistency
const section_path = 'UsersManagement.GroupsManagement';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Loading state
const isLoadingSettings = ref(true);

/**
 * Direct binding to the setting value from Pinia store
 * This computed property will automatically update when the store changes
 */
const onlyAddActiveMembers = computed({
  get: () => {
    const settings = appSettingsStore.getCachedSettings(section_path);
    if (!settings || settings.length === 0) return false;
    
    // Find the setting with name 'only.add.active.members'
    const setting = settings.find(s => s.setting_name === 'only.add.active.members');
    
    // Return the value or default (false) if not found
    const value = setting?.value !== undefined && setting?.value !== null 
      ? setting.value 
      : false;
    
    console.log('Computed setting "only.add.active.members" value:', value);
    return value;
  },
  set: (newValue) => {
    console.log('Setting value changed to:', newValue);
    // Update the setting using our update service
    updateSettingFromComponent(section_path, 'only.add.active.members', newValue);
  }
});

/**
 * Load settings from the backend
 */
async function loadSettings() {
  isLoadingSettings.value = true;
  
  try {
    console.log('Loading settings for Groups Management');
    const settings = await fetchSettings(section_path);
    
    if (settings && settings.length > 0) {
      console.log('Received settings:', settings);
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