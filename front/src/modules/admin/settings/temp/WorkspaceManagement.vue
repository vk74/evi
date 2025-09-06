<!--
  File: WorkspaceManagement.vue
  Description: Workspace management settings component
  Purpose: Configure workspace-related settings and templates
  
  Updated: 
  - Removed collaboration, widgets, and data & storage sections
  - Standardized divider colors to match other settings components
  - Removed unused variables from the script section
  - Used standard border-color rgba(0, 0, 0, 0.12) with opacity 1
-->

<script setup lang="ts">
import { ref } from 'vue';

// Workspace appearance
const workspaceLayout = ref('Standard');
const layoutOptions = ['Standard', 'Compact', 'Expanded', 'Custom'];
const sidebarPosition = ref('Left');
const positionOptions = ['Left', 'Right', 'Hidden'];
const defaultPanel = ref('Dashboard');
const panelOptions = ['Dashboard', 'Projects', 'Analytics', 'Calendar'];
const compactMode = ref(false);
const rememberLayout = ref(true);

// Workspace templates
const workspaceTemplates = ref([
  {
    id: 1,
    name: 'Blank Workspace',
    description: 'Start with an empty workspace',
    icon: 'mdi-file-outline'
  },
  {
    id: 2,
    name: 'Project Management',
    description: 'Optimized for managing projects and tasks',
    icon: 'mdi-clipboard-text-outline'
  },
  {
    id: 3,
    name: 'Data Analysis',
    description: 'Set up for data analysis and visualization',
    icon: 'mdi-chart-bar'
  },
  {
    id: 4,
    name: 'Development',
    description: 'Tailored for software development',
    icon: 'mdi-code-braces'
  }
]);
const showTemplateSelection = ref(true);
</script>

<template>
  <div class="workspace-management-container">
    <h2 class="text-h6 mb-4">
      workspace management
    </h2>
    
    <v-alert
      type="info"
      variant="tonal"
      density="compact"
      class="mb-4 mt-2"
    >
      компонент находится в разработке
    </v-alert>

    <!-- Workspace Appearance -->
    <div class="settings-section mb-4">
      <div class="section-title text-subtitle-1 d-flex align-center mb-4">
        <v-icon
          start
          icon="mdi-palette-outline"
          class="mr-2"
        />
        workspace appearance
      </div>
      
      <div class="section-content">
        <div class="d-flex flex-wrap">
          <div
            class="me-4 mb-4"
            style="min-width: 200px;"
          >
            <v-select
              v-model="workspaceLayout"
              :items="layoutOptions"
              label="default layout"
              variant="outlined"
              density="comfortable"
              color="teal-darken-2"
            />
          </div>
          
          <div
            class="me-4 mb-4"
            style="min-width: 200px;"
          >
            <v-select
              v-model="sidebarPosition"
              :items="positionOptions"
              label="sidebar position"
              variant="outlined"
              density="comfortable"
              color="teal-darken-2"
            />
          </div>
          
          <div
            class="mb-4"
            style="min-width: 200px;"
          >
            <v-select
              v-model="defaultPanel"
              :items="panelOptions"
              label="default panel"
              variant="outlined"
              density="comfortable"
              color="teal-darken-2"
            />
          </div>
        </div>
        
        <v-checkbox
          v-model="compactMode"
          label="compact mode"
          color="teal-darken-2"
          hide-details
          class="mt-4"
        />
        
        <v-checkbox
          v-model="rememberLayout"
          label="remember user layout preferences"
          color="teal-darken-2"
          hide-details
          class="mt-2"
        />
      </div>
      <v-divider class="mt-4" />
    </div>
    
    <!-- Workspace Templates -->
    <div class="settings-section">
      <div class="section-title d-flex align-center text-subtitle-1 mb-4">
        <v-icon
          start
          icon="mdi-checkbox-multiple-blank-outline"
          class="mr-2"
        />
        workspace templates
        <v-spacer />
        <v-btn
          size="small"
          color="teal-darken-2"
          variant="text"
          prepend-icon="mdi-plus"
        >
          add
        </v-btn>
      </div>
      
      <div class="section-content">
        <v-list
          :select-strategy="'single-select' as any"
          class="pa-0 bg-transparent"
        >
          <v-list-item
            v-for="template in workspaceTemplates"
            :key="template.id"
            :value="template.id"
            :subtitle="template.description"
            rounded="lg"
            class="mb-1"
          >
            <template #prepend>
              <v-icon
                :icon="template.icon"
                class="me-3"
                color="teal-darken-2"
              />
            </template>
            
            <template #title>
              {{ template.name }}
            </template>
            
            <template #append>
              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    v-bind="props"
                    color="teal-darken-2"
                  />
                </template>
                <v-list density="compact">
                  <v-list-item title="edit" />
                  <v-list-item title="duplicate" />
                  <v-list-item title="delete" />
                  <v-list-item title="set as default" />
                </v-list>
              </v-menu>
            </template>
          </v-list-item>
        </v-list>
        
        <v-switch
          v-model="showTemplateSelection"
          color="teal-darken-2"
          label="show template selection on workspace creation"
          hide-details
          class="mt-4"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.workspace-management-container {
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

/* Make v-list items more distinct when hovered */
:deep(.v-list-item:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>