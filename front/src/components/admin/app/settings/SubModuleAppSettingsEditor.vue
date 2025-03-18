<!--
  File: SubModuleAppSettingsEditor.vue
  Description: Application settings management component with category navigation
  Purpose: Provide a comprehensive interface for managing all application settings
  
  The component is structured as a two-panel layout:
  - Left panel: Categories navigation similar to mobile device settings
  - Right panel: Settings configuration for the selected category
  
  Each category contains relevant settings that can be configured by the user.
  Current implementation is a visual mockup to demonstrate UI capabilities.
-->

<template>
  <v-container fluid class="settings-container pa-0">
    <!-- Main layout with two panels -->
    <v-row no-gutters class="settings-layout">
      <!-- Left panel - Categories navigation -->
      <v-col cols="12" sm="4" md="3" lg="3" class="categories-panel">
        <v-card flat class="categories-card">
          <v-list bg-color="grey-lighten-4" class="categories-list">
            <v-list-subheader class="text-h6 font-weight-medium">
              Settings
            </v-list-subheader>
            
            <v-divider></v-divider>
            
            <v-list-item
              v-for="(category, index) in categories"
              :key="index"
              :active="selectedCategory === index"
              @click="selectedCategory = index"
              :prepend-icon="category.icon"
              :title="category.name"
              rounded="lg"
              class="my-1"
            >
              <template v-slot:append>
                <v-icon icon="mdi-chevron-right"></v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Right panel - Settings for selected category -->
      <v-col cols="12" sm="8" md="9" lg="9" class="settings-content-panel">
        <v-card flat class="settings-content-card">
          <v-toolbar density="compact" color="primary" class="settings-toolbar">
            <v-toolbar-title>{{ categories[selectedCategory].name }}</v-toolbar-title>
          </v-toolbar>

          <v-card-text>
            <component :is="categories[selectedCategory].component" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, shallowRef, defineComponent } from 'vue';

// Import all setting components
import GeneralSettings from './settings/GeneralSettings.vue';
import UserManagement from './settings/UserManagement.vue';
import ServiceManagement from './settings/ServiceManagement.vue';
import CatalogManagement from './settings/CatalogManagement.vue';
import LoggingSettings from './settings/LoggingSettings.vue';
import WorkspaceManagement from './settings/WorkspaceManagement.vue';

// Define categories and their associated components
// Using shallowRef for better performance since these are components
const categories = shallowRef([
  { 
    name: 'General Settings', 
    icon: 'mdi-cog-outline', 
    component: defineComponent(GeneralSettings)
  },
  { 
    name: 'User Management', 
    icon: 'mdi-account-group-outline', 
    component: defineComponent(UserManagement)
  },
  { 
    name: 'Service Management', 
    icon: 'mdi-tools', 
    component: defineComponent(ServiceManagement)
  },
  { 
    name: 'Catalog Management', 
    icon: 'mdi-view-grid-outline', 
    component: defineComponent(CatalogManagement)
  },
  { 
    name: 'Logging Settings', 
    icon: 'mdi-text-box-outline', 
    component: defineComponent(LoggingSettings)
  },
  { 
    name: 'Workspace Management', 
    icon: 'mdi-view-dashboard-outline', 
    component: defineComponent(WorkspaceManagement)
  }
]);

// Track the selected category
const selectedCategory = ref(0);

// For a mockup version, we could replace the component imports with functions
// that return placeholder components, but I'll keep the structure for now
// to demonstrate real-world architecture
</script>

<style scoped>
.settings-container {
  height: 100%;
  background-color: #f5f5f5;
}

.settings-layout {
  height: 100%;
  min-height: 90vh;
}

.categories-panel {
  border-right: 1px solid #e0e0e0;
  background-color: #f5f5f5;
}

.categories-card {
  height: 100%;
  border-radius: 0;
}

.categories-list {
  padding-top: 8px;
}

.settings-content-panel {
  background-color: white;
}

.settings-content-card {
  height: 100%;
  border-radius: 0;
}

.settings-toolbar {
  position: sticky;
  top: 0;
  z-index: 1;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .settings-layout {
    flex-direction: column;
  }
  
  .categories-panel {
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
}
</style>