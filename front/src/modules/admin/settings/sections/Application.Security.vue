<!--
  File: Application.Security.vue
  Version: 1.0.0
  Description: Security settings overview component for frontend
  Purpose: Provides overview and navigation to security-related settings sections
  Frontend file that serves as a container for security settings navigation
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAppSettingsStore } from '@/modules/admin/settings/state.app.settings';

// Section path identifier - using component name for better consistency
const section_path = 'Application.Security';

// Store reference
const appSettingsStore = useAppSettingsStore();

// Initialize component
onMounted(() => {
  console.log('Application.Security component initialized');
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
      выберите подраздел в навигаторе для настройки параметров безопасности
    </v-alert>
    
    <div class="settings-section">
      <div class="section-content">
        <p class="text-body-1">
          в данном разделе доступны настройки:
        </p>
        
        <v-list class="mt-4">
          <v-list-item>
            <template #prepend>
              <v-icon icon="mdi-account-clock-outline" color="teal-darken-2" />
            </template>
            <v-list-item-title>управление сессиями</v-list-item-title>
            <v-list-item-subtitle>настройка длительности и ограничений сессий</v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item>
            <template #prepend>
              <v-icon icon="mdi-form-textbox-password" color="teal-darken-2" />
            </template>
            <v-list-item-title>политика паролей</v-list-item-title>
            <v-list-item-subtitle>требования к сложности и сроку действия паролей</v-list-item-subtitle>
          </v-list-item>
        </v-list>
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